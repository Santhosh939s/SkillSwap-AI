const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Basic logging utility for analytics
const logAction = (action, meetingId, userId, details = {}) => {
    console.log(`[ANALYTICS] Action: ${action} | Meeting: ${meetingId} | User: ${userId} | Details:`, details);
};

exports.getMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find({
            $or: [{ requester: req.user.id }, { recipient: req.user.id }]
        })
        .populate('requester', 'name')
        .populate('recipient', 'name')
        .sort({ date: 1 });
        
        res.json({ success: true, message: 'Meetings fetched successfully', data: meetings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.requestMeeting = async (req, res) => {
    try {
        const { recipientId, topic, date, duration } = req.body;
        
        if (new Date(date) < new Date()) {
            return res.status(400).json({ success: false, message: 'Meeting start time cannot be in the past' });
        }
        
        if (duration !== undefined && duration <= 0) {
            return res.status(400).json({ success: false, message: 'Meeting duration must be greater than zero' });
        }
        
        const meeting = new Meeting({
            requester: req.user.id,
            recipient: recipientId,
            topic,
            date,
            duration: duration || 30, // default 30 mins
            createdBy: req.user.id,
            updatedBy: req.user.id
        });
        await meeting.save();
        
        logAction('Meeting Created', meeting._id, req.user.id, { topic, date });

        const recipient = await User.findById(recipientId);
        const requester = await User.findById(req.user.id);
        
        const notif = {
            type: 'meetingRequest',
            message: `${requester.name} requested a meeting about "${topic}" on ${new Date(date).toLocaleString()}.`
        };
        recipient.notifications.push(notif);
        await recipient.save();

        const clients = req.app.get('wsClients');
        if (clients) {
            const recipientWs = clients.get(recipientId.toString());
            if (recipientWs && recipientWs.readyState === 1) {
                recipientWs.send(JSON.stringify({ type: 'notification', payload: notif }));
            }
        }

        res.json({ success: true, message: 'Meeting requested successfully', data: meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateMeetingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const meeting = await Meeting.findById(req.params.id);
        
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
        
        // Only recipient can accept/reject
        if (meeting.recipient.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        meeting.status = status;
        meeting.updatedBy = req.user.id;
        
        // Generate meetingId when accepted
        if (status === 'accepted') {
            meeting.meetingId = uuidv4();
        }

        await meeting.save();
        
        logAction(`Meeting ${status === 'accepted' ? 'Accepted' : 'Rejected'}`, meeting._id, req.user.id);

        const requester = await User.findById(meeting.requester);
        const recipient = await User.findById(meeting.recipient);

        const notif = {
            type: 'meetingUpdate',
            message: `${recipient.name} ${status} your meeting request about "${meeting.topic}".`
        };
        requester.notifications.push(notif);
        await requester.save();

        const clients = req.app.get('wsClients');
        if (clients) {
            const requesterWs = clients.get(meeting.requester.toString());
            if (requesterWs && requesterWs.readyState === 1) {
                requesterWs.send(JSON.stringify({ type: 'notification', payload: notif }));
            }
        }

        res.json({ success: true, message: `Meeting ${status} successfully`, data: meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Cancel Meeting
exports.cancelMeeting = async (req, res) => {
    try {
        const { reason } = req.body;
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
        
        // Only the host (requester) can cancel a meeting according to rules, or recipient can if pending?
        // Wait, "Only the host can end or cancel a meeting." Let's enforce that.
        if (meeting.requester.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Only the host can cancel the meeting' });
        }

        meeting.status = 'cancelled';
        meeting.cancelReason = reason || '';
        meeting.updatedBy = req.user.id;
        await meeting.save();
        
        logAction('Meeting Cancelled', meeting._id, req.user.id, { reason });

        res.json({ success: true, message: 'Meeting cancelled successfully', data: meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Reschedule Meeting
exports.rescheduleMeeting = async (req, res) => {
    try {
        const { newDate } = req.body;
        
        if (new Date(newDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Meeting start time cannot be in the past' });
        }
        
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
        
        if (meeting.requester.toString() !== req.user.id && meeting.recipient.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        meeting.date = newDate;
        meeting.status = 'pending'; // Requires re-acceptance
        meeting.updatedBy = req.user.id;
        await meeting.save();
        
        logAction('Meeting Rescheduled', meeting._id, req.user.id, { newDate });

        res.json({ success: true, message: 'Meeting rescheduled successfully', data: meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// End Meeting (Host control)
exports.endMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
        
        if (meeting.requester.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Only requester (host) can end the meeting' });
        }

        meeting.status = 'completed';
        meeting.updatedBy = req.user.id;
        await meeting.save();
        
        logAction('Meeting Ended', meeting._id, req.user.id);

        res.json({ success: true, message: 'Meeting ended successfully', data: meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Join Meeting (Attendance)
exports.joinMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
        
        // Prevent unauthorized users
        if (meeting.requester.toString() !== req.user.id && meeting.recipient.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Only participants can join this meeting' });
        }
        
        let attendee = meeting.attendance.find(a => a.userId.toString() === req.user.id);
        
        if (!attendee) {
            meeting.attendance.push({ 
                userId: req.user.id, 
                joinedAt: Date.now(), 
                attendanceStatus: 'joined' 
            });
        } else {
            // Prevent duplicate joins (if already joined)
            if (attendee.attendanceStatus === 'joined') {
                return res.status(400).json({ success: false, message: 'You have already joined this meeting' });
            }
            attendee.attendanceStatus = 'joined';
            attendee.reconnectCount += 1;
            // Only update joinedAt if they haven't joined before, otherwise we just leave the initial join time or tracking reconnect.
            // Let's just track the initial joinedAt, and we'll calculate duration based on continuous blocks if we had to,
            // but for simplicity, we'll reset joinedAt for the current session to calculate partial durations later, 
            // OR just rely on total duration updating on 'leave'.
            attendee.joinedAt = Date.now(); // reset for the new session block
        }
        meeting.updatedBy = req.user.id;
        await meeting.save();
        
        logAction('Meeting Joined', meeting._id, req.user.id);
        
        res.json({ success: true, message: 'Meeting joined successfully', data: meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Leave Meeting (Attendance)
exports.leaveMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
        
        let attendee = meeting.attendance.find(a => a.userId.toString() === req.user.id);
        if (attendee && attendee.attendanceStatus === 'joined') {
            attendee.attendanceStatus = 'left';
            const leftAt = Date.now();
            attendee.leftAt = leftAt;
            
            // Calculate session duration in seconds
            const sessionDuration = Math.floor((leftAt - new Date(attendee.joinedAt).getTime()) / 1000);
            attendee.duration += sessionDuration; // Add to total duration
            attendee.disconnectCount += 1;
        }
        
        meeting.updatedBy = req.user.id;
        await meeting.save();
        
        logAction('Meeting Left', meeting._id, req.user.id, { totalDurationSeconds: attendee ? attendee.duration : 0 });
        
        res.json({ success: true, message: 'Meeting left successfully', data: meeting });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

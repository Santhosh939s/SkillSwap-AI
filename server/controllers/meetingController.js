const Meeting = require('../models/Meeting');
const User = require('../models/User');

exports.getMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find({
            $or: [{ requester: req.user.id }, { recipient: req.user.id }]
        })
        .populate('requester', 'name')
        .populate('recipient', 'name')
        .sort({ date: 1 });
        
        res.json(meetings);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.requestMeeting = async (req, res) => {
    try {
        const { recipientId, topic, date } = req.body;
        
        const meeting = new Meeting({
            requester: req.user.id,
            recipient: recipientId,
            topic,
            date
        });
        await meeting.save();

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

        res.json(meeting);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.updateMeetingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const meeting = await Meeting.findById(req.params.id);
        
        if (!meeting) return res.status(404).json({ msg: 'Meeting not found' });
        
        // Only recipient can accept/reject
        if (meeting.recipient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        meeting.status = status;
        await meeting.save();

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

        res.json(meeting);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

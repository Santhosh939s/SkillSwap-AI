const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date },
    leftAt: { type: Date },
    duration: { type: Number, default: 0 }, // Session duration in seconds
    networkDisconnects: { type: Number, default: 0 },
    reconnectCount: { type: Number, default: 0 },
    disconnectCount: { type: Number, default: 0 },
    attendanceStatus: { type: String, enum: ['joined', 'left', 'completed'], default: 'joined' }
}, { _id: false });

const meetingSchema = new mongoose.Schema({
    meetingId: { type: String, unique: true, sparse: true }, // WebRTC Room ID
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    date: { type: Date, required: true },
    duration: { type: Number, default: 0 }, // in minutes
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed', 'expired'], default: 'pending' },
    cancelReason: { type: String, default: '' },
    
    // Attendance
    attendance: [attendanceSchema],

    // Collaboration
    chat: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    files: [{
        url: { type: String },
        filename: { type: String },
        uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }],
    notes: {
        shared: { type: String, default: '' },
        personal: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            content: { type: String, default: '' }
        }]
    },

    // Recording Preparedness
    recording: {
        status: { type: String, enum: ['none', 'recording', 'processing', 'ready'], default: 'none' },
        url: { type: String, default: '' },
        duration: { type: Number, default: 0 },
        size: { type: Number, default: 0 },
        createdAt: { type: Date }
    },

    // Audit Info
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

// Database Indexes
meetingSchema.index({ requester: 1 });
meetingSchema.index({ recipient: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ date: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);

const { default: mongoose, Schema } = require("mongoose");


const auditSchema = new Schema({
    permissionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'permission'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    action: {
        type: String,
        enum: ['create', 'update', 'delete'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    previousState: {
        type: Object
    },
    newState: {
        type: Object
    }
});

const AuditLog = mongoose.model("AuditLog", auditSchema);

module.exports = AuditLog
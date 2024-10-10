const { default: mongoose, Schema } = require("mongoose");

const deviceMaintenanceSchema = new Schema({
    deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    status: {
        type: String,
        enum: ['Maintenance Done', 'Upcoming Maintenance', 'Maintenance Not Done'],
        required: true
    },
    maintainDate: {
        type: Date,
        required: [true, 'Maintain date is required'],
    },
    engineerName: {
        type: String,
        minlength: [3, 'Engineer name must be at least 3 characters long'],
        default: null
    },
    contactNumber: {
        type: String,
        default: null
    }
}, { timestamps: true });

const DeviceMaintenance = mongoose.model("deviceMaintenance", deviceMaintenanceSchema);

module.exports = DeviceMaintenance;

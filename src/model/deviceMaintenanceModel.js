const { default: mongoose, Schema } = require("mongoose");

const deviceMaintenanceSchema = new Schema({
    deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'device',
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
        default: null
    },
    contactNumber: {
        type: String,
        default: null
    },
    engineerEmail: {
        type: String,
        validate: {
            validator: function(v) {
                return v === null || /^\S+@\S+\.\S+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    isContactAdded: {
        type: Boolean,
        default: false
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
    }
}, { timestamps: true });

const DeviceMaintenance = mongoose.model("deviceMaintenance", deviceMaintenanceSchema);

module.exports = DeviceMaintenance;

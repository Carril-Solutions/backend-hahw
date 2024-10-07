const { default: mongoose, Schema } = require("mongoose");

const deviceMaintenanceSchema = new Schema({
    deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: props => `${props.value} is not a valid ObjectId!`
        }
    },
    status: {
        type: String,
        enum: ['Maintenance Done', 'Upcoming Maintenance', 'Maintenance Not Done'],
        required: true
    },
    maintainDate: {
        type: Date,
        required: [true, 'Maintain date is required'],
        validate: {
            validator: function(v) {
                if (!v) return true;
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const maintainDate = new Date(v);
                maintainDate.setHours(0, 0, 0, 0);
                return maintainDate >= now;
            },
            message: props => `Maintain date ${props.value} cannot be in the past!`
        }
    },
    engineerName: {
        type: String,
        minlength: [3, 'Engineer name must be at least 3 characters long'],
        default: null
    },
    contactNumber: {
        type: String,
        validate: {
            validator: function(v) {
                return v === null || /^\d{10}$/.test(v);
            },
            message: props => `${props.value} must be a 10-digit number!`
        },
        default: null
    }
}, { timestamps: true });

const DeviceMaintenance = mongoose.model("deviceMaintenance", deviceMaintenanceSchema);

module.exports = DeviceMaintenance;

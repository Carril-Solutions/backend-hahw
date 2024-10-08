const { default: mongoose, Schema } = require("mongoose");

const deviceTicketSchema = new Schema({
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
    sensor: {
        type: [mongoose.Schema.Types.ObjectId],
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
    },
    status: {
        type: String,
        enum: ['Resolved', 'Pending'],
        default: 'Pending',
    },
    ticketId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{6}$/.test(v);
            },
            message: props => `${props.value} must be a 6-digit number!`
        },
        default: () => Math.floor(100000 + Math.random() * 900000).toString()
    },
    remark: {
        type: String,
        required: [true, 'Remark is required'],
        minlength: [5, 'Remark must be at least 5 characters long']
    },
    engineerName: {
        type: String,
        required: [true, 'Engineer name is required'],
        minlength: [3, 'Engineer name must be at least 3 characters long']
    },
    engineerEmail: {
        type: String,
        required: [true, 'Engineer email is required'],
        validate: {
            validator: function(v) {
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    contactNumber: {
        type: String,
        required: [true, 'Engineer contact number is required'],
        validate: {
            validator: function(v) {
                return v === null || /^\d{10}$/.test(v);
            },
            message: props => `${props.value} must be a 10-digit number!`
        },
    },
    resolvedDate: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true;
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const maintainDate = new Date(v);
                maintainDate.setHours(0, 0, 0, 0);
                return maintainDate >= now;
            },
            message: props => `Resolved date ${props.value} cannot be in the past!`
        }
    },
    isResolved: {
        type: Boolean,
        required: true,
        default: false
    }
}, { timestamps: true });

const DeviceTicket = mongoose.model("deviceTicket", deviceTicketSchema);

module.exports = DeviceTicket;

const { default: mongoose, Schema } = require("mongoose");

const notifiedUserSchema = new Schema({
    userName: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} must be a 10-digit number!`
        }
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    }
});

const deviceSchema = new Schema({
    deviceName: {
        type: String,
        required: true
    },
    sensorNumber: {
        type: String,
        required: true
    },
    maintainance: {
        type: Number,
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    division: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    zone: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    deployUserName: {
        type: String,
        required: true
    },
    deployUserContactNumber: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} must be a 10-digit number!`
        }
    },
    deployDate: {
        type: String,
        required: true
    },
    deployTime: {
        type: String,
        required: true
    },
    warningHotTemprature: {
        type: String,
        required: true
    },
    warningWarmTemprature: {
        type: String,
        required: true
    },
    warningDifferentialTemprature: {
        type: String,
        required: true
    },
    notifiedUsers: {
        type: [notifiedUserSchema]
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    ambiant: {
        type: Number,
        required: true
    },
    gap_between: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const Device = mongoose.model("device", deviceSchema);
module.exports = Device;

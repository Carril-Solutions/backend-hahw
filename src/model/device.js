const { default: mongoose, Schema } = require("mongoose");

const notifiedUserSchema = new Schema({
    userName: {
        type: String,
    },
    contactNumber: {
        type: String,
    },
    email: {
        type: String,
    }
});

const deviceSchema = new Schema({
    deviceName: {
        type: String,
    },
    sensorNumber: {
        type: String,
    },
    maintainance: {
        type: Number,
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
    },
    division: {
        type: mongoose.Schema.Types.ObjectId,
    },
    zone: {
        type: mongoose.Schema.Types.ObjectId,
    },
    status: {
        type: Boolean,
        default: true
    },
    deployUserName: {
        type: String,
    },
    deployUserContactNumber: {
        type: String
    },    
    deployDate: {
        type: String,
    },
    deployTime: {
        type: String,
    },
    warningHotTemprature: {
        type: String,
    },
    warningWarmTemprature: {
        type: String,
    },
    warningDifferentialTemprature: {
        type: String,
    },
    notifiedUsers: {
        type: [notifiedUserSchema]
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    ambiant: {
        type: Number,
    },
    gap_between: {
        type: Number,
    }
}, { timestamps: true });

const Device = mongoose.model("device", deviceSchema);
module.exports = Device;

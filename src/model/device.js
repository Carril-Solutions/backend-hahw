const {default : mongoose, Schema} = require("mongoose");

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
    deviceName : {
        type : String,
        required : true
    },
    sensorNumber : {
        type : String,
        required : true
    },
    maintainance : {
        type : Number,
        required : true
    },
    location : {
        type : mongoose.Schema.Types.ObjectId
    },
    division : {
        type : mongoose.Schema.Types.ObjectId
    },
    zone : {
        type : mongoose.Schema.Types.ObjectId
    },
    status : {
        type : Boolean,
        default : true
    },
    deployUserName : {
        type : String,
    },
    deployUserContactNumber : {
        type : String,
    },
    deployUserEmailAddress : {
        type : String,
    },
    deployDate : {
        type : String,
    },
    deployTime : {
        type : String,
    },
    warningHotTemprature : {   
        type : String,
    },
    warningWarmTemprature : {   
        type : String,
    },
    warningDifferentialTemprature : {   
        type : String,
    },
    notifiedUsers: [notifiedUserSchema],
    adminId : {
        type : mongoose.Schema.Types.ObjectId
    },
}, {timestamps : true})

const Device = mongoose.model("device", deviceSchema)
module.exports = Device
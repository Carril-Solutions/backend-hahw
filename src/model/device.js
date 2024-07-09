const {default : mongoose, Schema} = require("mongoose");

const deviceSchema = new Schema({
    deviceName : {
        type : String,
        required : true
    },
    deviceCode : {
        type : String,
        required : true
    },
    sensorNumber : {
        type : String,
        required : true
    },
    type : {
        type : String,
        required : true
    },
    location : {
        type : mongoose.Schema.Types.ObjectId
    },
    divison : {
        type : mongoose.Schema.Types.ObjectId
    },
    zone : {
        type : mongoose.Schema.Types.ObjectId
    },
    region : {
        type : String,
        required : true
    },
    maintainanceDate : {
        type : String,
    },
    status : {
        type : Boolean,
        default : true
    },
    maintainanceUser : {
        type : String,
    },
    contactNumber : {
        type : String,
    },
    emailAddress : {
        type : String,
    },
    warningTemprature : {   
        type : String,
    },
    warningEmail : {
        type : String,
    },
    adminId : {
        type : mongoose.Schema.Types.ObjectId
    },
}, {timestamps : true})

const Device = mongoose.model("device", deviceSchema)
module.exports = Device
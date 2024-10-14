const {default : mongoose, Schema} = require("mongoose");

const zoneSchema = new Schema({
    zoneName : {
        type : String,
        required : true
    },
    status : {
        type : Boolean,
        default : true
    },
    adminId : {
        type : mongoose.Schema.Types.ObjectId
    },
}, {timestamps : true})

const Zone = mongoose.model("zone", zoneSchema)
module.exports = Zone
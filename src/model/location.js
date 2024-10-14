const {default : mongoose, Schema} = require("mongoose");

const loctionSchema = new Schema({
    locationName : {
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

const Location = mongoose.model("location", loctionSchema)
module.exports = Location
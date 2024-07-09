const {default : mongoose, Schema} = require("mongoose");   

const roleSchema = new Schema({
    role : {
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
    viewMachines : {
        type : Boolean,
        default : false
    },
    addMachines : {
        type : Boolean,
        default : false
    },
}, {timestamps : true})

const Role = mongoose.model("role", roleSchema)
module.exports = Role
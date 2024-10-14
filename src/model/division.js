const {default : mongoose, Schema} = require("mongoose");

const devisionSchema = new Schema({
    divisionName : {
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

const Division = mongoose.model("division", devisionSchema)
module.exports = Division
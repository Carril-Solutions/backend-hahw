const {default : mongoose, Schema} = require("mongoose");

const issueCodeSchema = new Schema({
    componentName : {
        type : String,
        required : true
    },
    issueCode : {
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

const IssueCode = mongoose.model("issuecode", issueCodeSchema)
module.exports = IssueCode
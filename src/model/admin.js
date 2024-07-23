const {default : mongoose, Schema} = require("mongoose");

const adminSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    phone : {
        type : String,
        required : true
    },
    role : {
        type  : String,
        default : "admin",
        required : true
    },
    status : {
        type : Boolean,
        default : true
    }
},
{timestamps : true}
); 

const Admin = mongoose.model("admin", adminSchema)
module.exports = Admin
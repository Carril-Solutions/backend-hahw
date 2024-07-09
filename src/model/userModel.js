const {default : mongoose, Schema} = require("mongoose");

const userSchema = new Schema({
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
        //type : mongoose.Schema.Types.ObjectId,
        type: Schema.Types.Mixed,
    },
    division : {
        type : mongoose.Schema.Types.ObjectId,
    },
    adminId : {
        type : mongoose.Schema.Types.ObjectId,
    },
    status : {
        type : Boolean,
        default : true
    }
},
{timestamps : true}
); 

const User = mongoose.model("user", userSchema)
module.exports = User
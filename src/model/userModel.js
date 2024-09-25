const {default : mongoose, Schema} = require("mongoose");

const userSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    password : {
        type : String,
        required : false
    },
    phone : {
        type : String,
        required : true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} must be a 10-digit number!`
        }
    },
    role : {
        type : mongoose.Schema.Types.ObjectId,
        // type: Schema.Types.Mixed,
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
    },
    zone : {
        type : mongoose.Schema.Types.ObjectId,
    },
    device : {
        type : mongoose.Schema.Types.Array,
        ref: 'Device'
    },
},
{timestamps : true}
); 

const User = mongoose.model("user", userSchema)
module.exports = User
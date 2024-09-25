const { default: mongoose, Schema } = require("mongoose");

const adminSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} must be a 10-digit number!`
        }
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin', 'user '],
        default: 'user'
    },
    status: {
        type: Boolean,
        default: true
    }   
},
    { timestamps: true }
);

const Admin = mongoose.model("admin", adminSchema)
module.exports = Admin
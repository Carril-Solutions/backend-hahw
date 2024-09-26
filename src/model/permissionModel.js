const { default: mongoose, Schema } = require("mongoose");

const permissionSchema = new Schema({
    permissionName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    adminId : {
        type : mongoose.Schema.Types.ObjectId
    },
},
    { timestamps: true }
);

const Permission = mongoose.model("permission", permissionSchema)
module.exports = Permission
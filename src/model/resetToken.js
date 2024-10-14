const { model, Schema } = require("mongoose");
const resetSchema = new Schema({
  email: String,
  resetToken: String,
  expiresAt: String,
  tokenVerified: { type: Boolean, default: false },
});

module.exports = model("resettoken", resetSchema);

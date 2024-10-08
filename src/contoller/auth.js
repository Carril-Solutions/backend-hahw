const User = require("../model/userModel");
const Role = require("../model/role");
const Division = require("../model/division");
const sendEmail = require("../utils/sendEmail");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const resetTokenModel = require("../model/resetToken");
const jwt = require("jsonwebtoken");
const { createJwtToken } = require("../middlewares/auth");
const { comparePassword, hashPassword } = require("../utils/password");
const {
  validateFields,
  validateFound,
  validateId,
  alreadyFound,
} = require("../validatores/commonValidations");
const { Types: { ObjectId } } = require('mongoose');
const Admin = require("../model/admin");

// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) return validateFields(res);

//     const user = await User.findOne({ email: email });
//     if (!user || !user.password) {
//       return res.status(400).send({
//         error:
//           "The credentials you provided are incorrect, please try again.",
//       });
//     }

//     const match = await comparePassword(password, user.password);
//     if (!match)
//       return res.status(400).send({
//         error:
//           "The credentials you provided are incorrect, please try again.",
//       });

//     // Fetch role details using role ID
//     const role = await Role.findById(user.role);
//     if (!role) {
//       return res.status(400).send({
//         error: "User role not found.",
//       });
//     }

//     const payload = {
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: role.role,
//     };

//     const token = createJwtToken(payload);
//     if (token) {
//       payload["token"] = token;
//     }

//     return res
//       .status(200)
//       .send({ data: payload, message: "Successfully logged in" });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: "Something broke" });
//   }
// };

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return validateFields(res);

    // Try to find the user in the User collection
    let user = await User.findOne({ email: email });
    let isAdmin = false;
    let role = null;

    if (!user) {
      // If user is not found in the User collection, try the Admin collection
      user = await Admin.findOne({ email: email });
      isAdmin = true;
    }

    if (!user || !user.password) {
      return res.status(400).send({
        error:
          "The credentials you provided are incorrect, please try again.",
      });
    }

    const match = await comparePassword(password, user.password);
    if (!match)
      return res.status(400).send({
        error:
          "The credentials you provided are incorrect, please try again.",
      });

    if (isAdmin) {
      // If the user is from the Admin collection, the role is a string
      role = user.role;
    } else {
      // If the user is from the User collection, the role is an ObjectId
      role = await Role.findById(user.role);
      if (!role) {
        return res.status(400).send({
          error: "User role not found.",
        });
      }
      role = role.role;
    }

    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: role,
      isAdmin: isAdmin,
    };

    const token = createJwtToken(payload);
    if (token) {
      payload["token"] = token;
    }

    return res
      .status(200)
      .send({ data: payload, message: "Successfully logged in" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

// function generateToken() {
//   return Math.random().toString(36).substring(2, 14);
// }

function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const admin = await Admin.findOne({ email });
    if (!user && !admin) return res.status(400).send({ error: "User not found" });

    // Generate and store reset token
    const resetToken = generateToken();
    let data = { resetToken: resetToken };
    const isEmailSent = await sendEmail(
      email,
      data,
      "forgot",
      `Reset Password`
    );

    if (isEmailSent) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await resetTokenModel.findOneAndUpdate(
        { email },
        { $set: { resetToken: resetToken, expiresAt: expiresAt } },
        { upsert: true }
      );
      return res.status(200).send({ message: "Email sent successfully" });
    } else {
      return res.status(500).send({ error: "Failed to send email" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const { email, resetToken } = req.body;

    // Find the reset token document
    const token = await resetTokenModel.findOne({ email, resetToken });

    if (!token) {
      return res.status(400).send({ error: "Invalid token or email" });
    }

    const currentTime = new Date().toISOString();
    if (currentTime > token.expiresAt) {
      return res.status(400).send({ error: "Token has expired" });
    }

    // Mark the token as verified
    await resetTokenModel.updateOne(
      { email, resetToken },
      { $set: { tokenVerified: true } }
    );

    return res.status(200).send({ message: "Token verified successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.query;

    if (!token || !password) return validateFields(res);

    const data = await resetTokenModel.findOne({ resetToken: token });
    if (!data) return res.status(404).send({ error: "Data not found." });

    const email = data.email;

    const adminData = await Admin.findOne({ email });
    if (adminData) {
      if (await comparePassword(password, adminData.password)) {
        return res.status(400).send({ error: "New password must be different." });
      }
      const passwordHash = await hashPassword(password);
      await Admin.findOneAndUpdate(
        { email: email },
        { $set: { password: passwordHash } },
        { new: true }
      );
      return res.status(200).send({ message: "Admin password changed successfully." });
    }

    const userData = await User.findOne({ email });
    if (userData) {
      if (await comparePassword(password, userData.password)) {
        return res.status(400).send({ error: "New password must be different." });
      }
      const passwordHash = await hashPassword(password);
      await User.findOneAndUpdate(
        { email: email },
        { $set: { password: passwordHash } },
        { new: true }
      );
      return res.status(200).send({ message: "User password changed successfully." });
    }

    return res.status(404).send({ error: "User or Admin not found." });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "An unexpected error occurred. Please try again later." });
  }
};


// exports.profile = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     if (!userId) {
//       return res.status(401).send({ error: "Unauthorized access" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).send({ error: "User not found" });
//     }

//     let role = null;
//     if (ObjectId.isValid(user.role)) {
//       role = await Role.findById(user.role);
//       if (!role) {
//         return res.status(400).send({ error: "User role not found" });
//       }
//     } else if (typeof user.role === 'string') {
//       role = { role: user.role };
//     }

//     let divisionName = null;
//     if (ObjectId.isValid(user.division)) {
//       const division = await Division.findById(user.division);
//       if (division) {
//         divisionName = division.divisionName;
//       }
//     }

//     const userProfile = {
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: role.role,
//       division: divisionName,
//     };

//     return res.status(200).send({ data: userProfile });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ error: "Something broke" });
//   }
// };

exports.profile = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).send({ error: "Unauthorized access" });
    }

    let user = await User.findById(userId);
    let isAdmin = false;

    if (!user) {
      user = await Admin.findById(userId);
      isAdmin = true;
    }

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    let role = null;
    if (isAdmin) {
      // If user is from Admin collection, role is a string
      role = { role: user.role };
    } else {
      // If user is from User collection, role is an ObjectId
      if (ObjectId.isValid(user.role)) {
        role = await Role.findById(user.role);
        if (!role) {
          return res.status(400).send({ error: "User role not found" });
        }
      } else if (typeof user.role === 'string') {
        role = { role: user.role };
      }
    }

    let divisionName = null;
    if (!isAdmin && ObjectId.isValid(user.division)) {
      const division = await Division.findById(user.division);
      if (division) {
        divisionName = division.divisionName;
      }
    }

    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: role.role,
      division: divisionName,
    };

    return res.status(200).send({ data: userProfile });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

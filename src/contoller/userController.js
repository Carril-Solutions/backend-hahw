const User = require("../model/userModel");
const Role = require("../model/role");
const Division = require("../model/division");
const Zone = require("../model/zone");
const Location = require("../model/location");
const { createJwtToken } = require("../middlewares/auth");
const { comparePassword, hashPassword } = require("../utils/password");
const Admin = require("../model/admin");
const {
  validateFields,
  validateFound,
  validateId,
  alreadyFound,
} = require("../validatores/commonValidations");
const mongoose = require("mongoose");

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, role, status } = req.body;
    if (!name || !email || !password || !phone || !role) {
      return validateFields(res);
    }
    const userFound = await Admin.findOne({ email });
    if (userFound) {
      return alreadyFound(res);
    }
    const admin = await User.findOne({ email });
    if (admin) {
      return alreadyFound(res);
    }
    const passwordHash = await hashPassword(password);
    const data = {
      name,
      email,
      password: passwordHash,
      phone,
      role,
      status,
    };
    const users = await Admin.create(data);
    return res
      .status(201)
      .send({ data: users, message: "Admin created successfully" });
  } catch (error) {if (error.name === 'ValidationError') {
    return res.status(400).send({
      error: Object.keys(error.errors).map(field =>
        `${field}: ${error.errors[field].message}`
      ).join(", ")
    });
  }
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.createUser = async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      user = req.user._id;
    }
    const { name, email, phone, role, division, status, zone, device } = req.body;
    if (!name || !email || !phone || !role) {
      return validateFields(res);
    }
    const userFound = await User.findOne({ email });
    if (userFound) {
      return alreadyFound(res);
    }

    const deviceIds = device.map(id => new mongoose.Types.ObjectId(id));
  
    const data = {
      name,
      email,
      phone,
      role,
      division,
      status,
      adminId: user,
      zone,
      device: deviceIds
    };

    if (!Array.isArray(data.device)) {
      return res.status(400).send({ error: "Device must be an array of IDs." });
    }

    const users = await User.create(data);
    return res
      .status(201)
      .send({ data: users, message: "User created successfully" });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({
        error: Object.keys(error.errors).map(field =>
          `${field}: ${error.errors[field].message}`
        ).join(", ")
      });
    }
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const admin = req.user?._id;
    const userId = req.params.userId;
    if (!userId) {
      return validateId(res);
    }
    const user = await User.findById(userId);
    if (!user) {
      return validateFound(res);
    }
    const { name, email, password, phone, role, division, status, zone, device } = req.body;
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (division) user.division = division;
    if (status !== undefined) user.status = status;
    if (admin) user.adminId = admin;
    if (zone) user.zone = zone;
    if (device) {
      user.device = device.map(id => new mongoose.Types.ObjectId(id));
    }

    await user.save();
    return res
      .status(201)
      .send({ data: user, message: "User updated successfully" });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({
        error: Object.keys(error.errors).map(field =>
          `${field}: ${error.errors[field].message}`
        ).join(", ")
      });
    }
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return validateId(res);
    }
    const user = await User.findById(userId);
    if (!user) {
      return validateFound(res);
    }
    user.status = !user.status;
    await user.save();
    return res
      .status(201)
      .send({ data: user, message: "User status updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getUser = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await User.countDocuments().exec())) {
      result.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      result.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    const order = req.query.order || "";
    const sort = req.query.sort || "";
    const search = req.query.search || "";
    const divisionNameFilter = req.query.division || "";
    const roleFilter = req.query.role || "";
    const statusFilter = req.query.status;

    let sortOrder = {};
    if (order === "ascending") {
      sortOrder = { [sort]: 1 };
    } else if (order === "descending") {
      sortOrder = { [sort]: -1 };
    } else {
      sortOrder = { createdAt: -1 };
    }

    let searchQuery = {};

    if (search) {
      const roles = await Role.find({
        role: { $regex: new RegExp(search, "si") },
      }).select("_id");
      const roleIds = roles.map((role) => role._id);

      const divisions = await Division.find({
        divisionName: { $regex: new RegExp(search, "si") },
      }).select("_id");
      const divisionIds = divisions.map((division) => division._id);

      searchQuery = {
        $or: [
          { name: { $regex: new RegExp(search, "si") } },
          { email: { $regex: new RegExp(search, "si") } },
          { role: { $in: roleIds } },
          { division: { $in: divisionIds } },
        ],
      };
    }

    if (divisionNameFilter) {
      const divisions = await Division.find({
        divisionName: { $regex: new RegExp(divisionNameFilter, "si") },
      }).select("_id");
      const divisionIds = divisions.map((division) => division._id);
      searchQuery.division = { $in: divisionIds };
    }

    if (statusFilter !== undefined && statusFilter !== "") {
      searchQuery.status = statusFilter === 'true';
    }

    if (roleFilter) {
      const roles = await Role.find({
        role: roleFilter,
      }).select("_id");
      const roleIds = roles.map((role) => role._id);
      if (roleIds.length > 0) {
        searchQuery.role = { $in: roleIds };
      }
    }

    let users = await User.find(searchQuery)
      .populate({
        path: "role",
        model: "role",
        select: "_id role",
      })
      .populate({
        path: "division",
        model: "division",
        select: "_id divisionName",
      })
      .populate({
        path: "device",
        model: "device",
        select: "_id deviceName",
      })
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);

    const count = users.length;

    return res.status(200).send({
      message: "Users Fetched Successfully",
      data: users,
      totalCount: count,
      pagination: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};


exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return validateId(res);
    }
    const user = await User.findById(userId)
      .populate({
        path: "role",
        model: "role",
        select: "_id role",
      })
      .populate({
        path: "division",
        model: "division",
        select: "_id divisionName",
      });
    if (!user) {
      return validateFound(res);
    }
    return res
      .status(200)
      .send({ data: user, message: "User fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return validateId(res);
    }
    const user = await User.findByIdAndDelete(userId);
    return res
      .status(201)
      .send({ data: user, message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getSelectedRoles = async (req, res) => {
  try {
    const roles = await Role.find({ status: true })
      .select("_id role");
    return res
      .status(200)
      .send({ data: roles, message: "Roles fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
}

exports.getSelectedDivisions = async (req, res) => {
  try {
    const roles = await Division.find({ status: true })
      .select("_id divisionName");
    return res
      .status(200)
      .send({ data: roles, message: "Division fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
}

exports.getSelectedLocations = async (req, res) => {
  try {
    const roles = await Location.find({ status: true })
      .select("_id locationName");
    return res
      .status(200)
      .send({ data: roles, message: "Locations fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
}

exports.getSelectedZones = async (req, res) => {
  try {
    const roles = await Zone.find({ status: true })
      .select("_id zoneName");
    return res
      .status(200)
      .send({ data: roles, message: "Zones fetched successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
}
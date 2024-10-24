const Role = require("../model/role");
const {
  validateFields,
  validateFound,
  validateId,
  alreadyFound,
} = require("../validatores/commonValidations");
const mongoose = require("mongoose");

exports.createRole = async (req, res) => {
  try {
    const admin = req.user?._id;
    const { role, status, addMachines, viewMachines } = req.body;
    if (!role) {
      return validateFields(res);
    }
    const data = {
      role,
      status,
      viewMachines,
      addMachines,
      adminId: admin,
    };
    const user = await Role.create(data);
    return res
      .status(201)
      .send({ data: user, message: "Role created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateRoles = async (req, res) => {
  try {
    const admin = req.user?._id;
    const rolesData = req.body.roles;

    if (!Array.isArray(rolesData) || rolesData.length === 0) {
      return res.status(400).send({ error: "Invalid input: roles data must be an array" });
    }

    const updatedRoles = [];

    for (const roleData of rolesData) {
      const { roleId, role, status, addMachines, viewMachines } = roleData;

      if (!roleId) {
        return validateId(res);
      }

      const roleToUpdate = await Role.findById(roleId);
      if (!roleToUpdate) {
        return validateFound(res);
      }

      if (role) roleToUpdate.role = role;
      if (status !== undefined) roleToUpdate.status = status;
      if (addMachines) roleToUpdate.addMachines = addMachines;
      if (viewMachines) roleToUpdate.viewMachines = viewMachines;
      if (admin) roleToUpdate.adminId = admin;

      await roleToUpdate.save();
      updatedRoles.push(roleToUpdate);
    }

    return res.status(200).send({ data: updatedRoles, message: "Roles updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};


exports.updateRoleStatus = async (req, res) => {
  try {
    const roleId = req.params.roleId;
    if (!roleId) {
      return validateId(res);
    }
    const user = await Role.findById(roleId);
    if (!user) {
      return validateFound(res);
    }
    user.status = !user.status;
    await user.save();
    return res
      .status(201)
      .send({ data: user, message: "Status updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getRole = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await Role.countDocuments().exec())) {
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

    let sortOrder = {};
    if (order === "ascending") {
      sortOrder = { [sort]: 1 };
    } else if (order === "descending") {
      sortOrder = { [sort]: -1 };
    } else {
      sortOrder = { createdAt: -1 };
    }

    const search = req.query.search || "";

    let searchQuery = search
      ? {
        $or: [
          {
            role: { $regex: new RegExp(search), $options: "si" },
          },
        ],
      }
      : {};
    const roles = await Role.find(searchQuery)
      .populate({
        path: "permission",
        model: "permission",
        select: "_id permissionName",
      })
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);
    const count = await Role.countDocuments();
    return res
      .status(200)
      .send({
        message: "Roles Fetched Succefulluy",
        data: roles,
        totalCounts: count,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const roleId = req.params.roleId;
    if (!roleId) {
      return validateId(res);
    }
    const roles = await Role.findByIdAndDelete(roleId);
    if (!roles) {
      return validateFound(res);
    }
    return res
      .status(201)
      .send({ data: roles, message: "Role deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.allowPermission = async (req, res) => {
  try {
    const roleId = req.params.roleId;
    if (!roleId) {
      return validateId(res);
    }
    const roles = await Role.findById(roleId);
    if (!roles) {
      return validateFound(res);
    }
    const dataToUpdate = req.body.permissions;
    const permissionIds = dataToUpdate.map(id => new mongoose.Types.ObjectId(id));

    const updateRole = await Role.findOneAndUpdate(
      { _id: roleId },
      { $set: { permission: permissionIds } },
      { new: true }
    );
    if (updateRole) {
      return res.status(200).send({
        message: "Permissions updated successfully",
        data: updateRole,
      });
    } else {
      return res
        .status(400)
        .send({ message: "Failed to update permissions" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};
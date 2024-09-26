const Permission = require("../model/permissionModel");
const {
  validateFound,
  validateId,
} = require("../validatores/commonValidations");

exports.createPermission = async (req, res) => {
  try {
    const admin = req.user?._id;
    const { permissionName, description } = req.body;

    const missingFields = [];
    if (!permissionName) missingFields.push("permissionName");
    if (!description) missingFields.push("description");

    if (missingFields.length > 0) {
      return res.status(400).send({
        error: `${missingFields.join(", ")}: fields are required.`,
      });
    }

    const data = {
      permissionName,
      description,
      adminId: admin,
    };

    const permission = await Permission.create(data);
    return res.status(201).send({ data: permission, message: "Permission created successfully" });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({
        error: Object.keys(error.errors).map(field =>
          `${field}: ${error.errors[field].message}`
        ).join(", ")
      });
    }
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updatePermission = async (req, res) => {
  try {
    const permissionId = req.params.permissionId;
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return validateFound(res);
    }

    const { permissionName, description } = req.body;

    if (permissionName) permission.permissionName = permissionName;
    if (description) permission.description = description;

    await permission.save();
    return res.status(200).send({ data: permission, message: "Permission updated successfully" });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).send({
        error: Object.keys(error.errors).map(field =>
          `${field}: ${error.errors[field].message}`
        ).join(", ")
      });
    }
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getPermission = async (req, res) => {
  try {
    const permissions = await Permission.find()
      .populate({ path: "adminId", select: "_id name" }) 
      .sort({ createdAt: -1 });

    return res.status(200).send({ message: "Permissions fetched successfully", data: permissions });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deletePermission = async (req, res) => {
  try {
    const permissionId = req.params.permissionId;

    if (!permissionId) {
      return validateId(res);
    }

    const permission = await Permission.findByIdAndDelete(permissionId);
    if (!permission) {
      return validateFound(res);
    }

    return res.status(200).send({ data: permission, message: "Permission deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

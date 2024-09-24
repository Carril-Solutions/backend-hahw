const Device = require("../model/device");
const {
  validateFields,
  validateFound,
  validateId,
  alreadyFound,
} = require("../validatores/commonValidations");

exports.createDevice = async (req, res) => {
  try {
    const admin = req.user?._id;
    const {
      deviceName,
      deviceCode,
      sensorNumber,
      type,
      location,
      division,
      zone,
      region,
      maintainanceDate,
      status,
      maintainanceUser,
      contactNumber,
      emailAddress,
      warningTemprature,
      warningEmail,
    } = req.body;

    if (!deviceName || !deviceCode || !sensorNumber || !type || !region) {
      return res.status(400).send({ error: "All required fields must be provided." });
    }

    const data = {
      deviceName,
      deviceCode,
      sensorNumber,
      type,
      location,
      division,
      zone,
      region,
      maintainanceDate,
      status,
      maintainanceUser,
      contactNumber,
      emailAddress,
      warningTemprature,
      warningEmail,
      adminId: admin,
    };

    const device = await Device.create(data);
    return res.status(201).send({ data: device, message: "Device created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const admin = req.user?._id;
    const deviceId = req.params.deviceId;
    
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).send({ error: "Device not found." });
    }

    const {
      deviceName,
      deviceCode,
      sensorNumber,
      type,
      location,
      division,
      zone,
      region,
      maintainanceDate,
      status,
      maintainanceUser,
      contactNumber,
      emailAddress,
      warningTemprature,
      warningEmail,
    } = req.body;

    if (deviceName) device.deviceName = deviceName;
    if (deviceCode) device.deviceCode = deviceCode;
    if (sensorNumber) device.sensorNumber = sensorNumber;
    if (type) device.type = type;
    if (location) device.location = location; 
    if (division) device.division = division;
    if (zone) device.zone = zone; 
    if (region) device.region = region;
    if (maintainanceDate) device.maintainanceDate = maintainanceDate;
    if (status !== undefined) device.status = status;
    if (maintainanceUser) device.maintainanceUser = maintainanceUser;
    if (contactNumber) device.contactNumber = contactNumber;
    if (emailAddress) device.emailAddress = emailAddress;
    if (warningTemprature) device.warningTemprature = warningTemprature;
    if (warningEmail) device.warningEmail = warningEmail;

    if (admin) device.adminId = admin;

    await device.save();
    return res.status(200).send({ data: device, message: "Device updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateDeviceStatus = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    if (!deviceId) {
      return res.status(400).send({ error: "Device ID is required." });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).send({ error: "Device not found." });
    }

    device.status = !device.status;
    await device.save();

    return res.status(200).send({ data: device, message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getDevice = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await Device.countDocuments().exec())) {
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
            { deviceName: { $regex: new RegExp(search), $options: "si" } },
            { deviceCode: { $regex: new RegExp(search), $options: "si" } },
            { region: { $regex: new RegExp(search), $options: "si" } },
          ],
        }
      : {};

    const devices = await Device.find(searchQuery)
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);
    const count = await Device.countDocuments();

    return res.status(200).send({
      message: "Devices fetched successfully",
      data: devices,
      totalCounts: count,
      pagination: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const device = await Device.findByIdAndDelete(deviceId);
    if (!device) {
      return res.status(404).send({ error: "Device not found." });
    }
    return res.status(200).send({ data: device, message: "Device deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};


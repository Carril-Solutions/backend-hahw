const Device = require("../model/device");
const Division = require("../model/division");

const {
  validateFields,
  validateFound,
  validateId,
} = require("../validatores/commonValidations");

exports.createDevice = async (req, res) => {
  try {
    const admin = req.user?._id;
    const {
      deviceName,
      sensorNumber,
      maintainance,
      location,
      division,
      zone,
      status,
      deployUserName,
      deployUserContactNumber,
      deployDate,
      deployTime,
      warningHotTemprature,
      warningWarmTemprature,
      warningDifferentialTemprature,
      notifiedUsers
    } = req.body;

    const missingFields = [];

    if (!deviceName) missingFields.push("deviceName");
    if (!sensorNumber) missingFields.push("sensorNumber");
    if (!maintainance) missingFields.push("maintainance");
    if (!location) missingFields.push("location");
    if (!division) missingFields.push("division");
    if (!zone) missingFields.push("zone");
    if (!deployUserName) missingFields.push("deployUserName");
    if (!deployUserContactNumber) missingFields.push("deployUserContactNumber");
    if (!deployDate) missingFields.push("deployDate");
    if (!deployTime) missingFields.push("deployTime");
    if (!warningHotTemprature) missingFields.push("warningHotTemprature");
    if (!warningWarmTemprature) missingFields.push("warningWarmTemprature");
    if (!warningDifferentialTemprature) missingFields.push("warningDifferentialTemprature");
    if (!notifiedUsers) missingFields.push("notifiedUsers");

    if (missingFields.length > 0) {
      return res.status(400).send({
        error: `${missingFields.join(", ")}: fields are required.`
      });
    }

    const data = {
      deviceName,
      sensorNumber,
      maintainance,
      location,
      division,
      zone,
      status,
      deployUserName,
      deployUserContactNumber,
      deployDate,
      deployTime,
      warningHotTemprature,
      warningWarmTemprature,
      warningDifferentialTemprature,
      notifiedUsers,
      adminId: admin,
    };

    const device = await Device.create(data);
    return res.status(201).send({ data: device, message: "Device created successfully" });
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




exports.updateDevice = async (req, res) => {
  try {
    const admin = req.user?._id;
    const deviceId = req.params.deviceId;

    const device = await Device.findById(deviceId);
    if (!device) {
      return validateFound(res);
    }

    const {
      deviceName,
      sensorNumber,
      maintainance,
      location,
      division,
      zone,
      status,
      deployUserName,
      deployUserContactNumber,
      deployDate,
      deployTime,
      warningHotTemprature,
      warningWarmTemprature,
      warningDifferentialTemprature,
      notifiedUsers,
    } = req.body;

    if (deviceName) device.deviceName = deviceName;
    if (sensorNumber) device.sensorNumber = sensorNumber;
    if (maintainance !== undefined) device.maintainance = maintainance;
    if (location) device.location = location;
    if (division) device.division = division;
    if (zone) device.zone = zone;
    if (status !== undefined) device.status = status;
    if (deployUserName) device.deployUserName = deployUserName;
    if (deployUserContactNumber) device.deployUserContactNumber = deployUserContactNumber;
    if (deployDate) device.deployDate = deployDate;
    if (deployTime) device.deployTime = deployTime;
    if (warningHotTemprature) device.warningHotTemprature = warningHotTemprature;
    if (warningWarmTemprature) device.warningWarmTemprature = warningWarmTemprature;
    if (warningDifferentialTemprature) device.warningDifferentialTemprature = warningDifferentialTemprature;

    if (notifiedUsers !== undefined) {
      device.notifiedUsers = notifiedUsers;
    }

    if (admin) device.adminId = admin;

    await device.save();
    return res.status(200).send({ data: device, message: "Device updated successfully" });
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


exports.updateDeviceStatus = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    if (!deviceId) {
      return validateId(res);
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return validateFound(res);
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
    const divisionNameFilter = req.query.division || "";
    const statusFilter = req.query.status;
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

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
          { sensorNumber: { $regex: new RegExp(search), $options: "si" } },
          { deployUserName: { $regex: new RegExp(search), $options: "si" } },
          { warningUserName: { $regex: new RegExp(search), $options: "si" } },
        ],
      }
      : {};

    if (divisionNameFilter) {
      const divisions = await Division.find({
        divisionName: { $regex: new RegExp(divisionNameFilter, "si") },
      }).select("_id");
      const divisionIds = divisions.map((division) => division._id);
      searchQuery.division = { $in: divisionIds };
    }

    if (statusFilter !== undefined) {
      searchQuery.status = statusFilter === 'true';
    }

    const devices = await Device.find(searchQuery)
      .populate({
        path: "division",
        model: "division",
        select: "_id divisionName",
      })
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);

    const totalCount = devices.length;

    if (endIndex < totalCount) {
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

    return res.status(200).send({
      message: "Devices fetched successfully",
      data: devices,
      totalCounts: totalCount,
      pagination: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};


exports.deleteDevice = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;

    if (!deviceId) {
      return validateId(res);
    }

    const device = await Device.findByIdAndDelete(deviceId);

    if (!device) {
      return validateFound(res);
    }

    return res.status(200).send({ data: device, message: "Device deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};


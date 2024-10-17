const Device = require("../model/device");
const Division = require("../model/division");
const DeviceMaintenance = require("../model/deviceMaintenanceModel");
const modelName = "IotCollection";
const mongoose = require("mongoose");
let DynamicModel;

if (mongoose.models[modelName]) {
  DynamicModel = mongoose.models[modelName];
} else {
  const dynamicSchema = new mongoose.Schema(
    {},
    { strict: false, timestamps: true }
  );
  DynamicModel = mongoose.model(modelName, dynamicSchema);
}

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
      notifiedUsers,
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
    if (!warningDifferentialTemprature)
      missingFields.push("warningDifferentialTemprature");
    if (!notifiedUsers) missingFields.push("notifiedUsers");

    if (missingFields.length > 0) {
      return res.status(400).send({
        error: `${missingFields.join(", ")}: fields are required.`,
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

    const selectDate = new Date(req.body.deployDate);

    if (isNaN(selectDate)) {
      return res.status(400).send({ error: "Invalid deployDate format." });
    }

    const maintenanceRecords = [];

    for (let i = 0; i < 60; i++) {
      const maintenanceDate = new Date(selectDate);
      maintenanceDate.setMonth(selectDate.getMonth() + i);

      maintenanceRecords.push({
        deviceId: device._id,
        status: "Upcoming Maintenance",
        maintainDate: maintenanceDate,
        engineerName: null,
        engineerEmail: null,
        contactNumber: null,
        adminId: admin,
      });
    }

    await DeviceMaintenance.insertMany(maintenanceRecords);

    return res
      .status(201)
      .send({ data: device, message: "Device created successfully" });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).send({
        error: Object.keys(error.errors)
          .map((field) => `${field}: ${error.errors[field].message}`)
          .join(", "),
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
    if (deployUserContactNumber)
      device.deployUserContactNumber = deployUserContactNumber;
    if (deployDate) device.deployDate = deployDate;
    if (deployTime) device.deployTime = deployTime;
    if (warningHotTemprature)
      device.warningHotTemprature = warningHotTemprature;
    if (warningWarmTemprature)
      device.warningWarmTemprature = warningWarmTemprature;
    if (warningDifferentialTemprature)
      device.warningDifferentialTemprature = warningDifferentialTemprature;

    if (notifiedUsers !== undefined) {
      device.notifiedUsers = notifiedUsers;
    }

    if (admin) device.adminId = admin;

    await device.save();
    return res
      .status(200)
      .send({ data: device, message: "Device updated successfully" });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).send({
        error: Object.keys(error.errors)
          .map((field) => `${field}: ${error.errors[field].message}`)
          .join(", "),
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

    return res
      .status(200)
      .send({ data: device, message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getDevice = async (req, res) => {
  try {
    const divisionNameFilter = req.query.division || "";
    const statusFilter = req.query.status;
    const search = req.query.search || "";

    let searchQuery = {};

    if (search) {
      searchQuery = {
        $or: [
          { deviceName: { $regex: new RegExp(search), $options: "si" } },
          { sensorNumber: { $regex: new RegExp(search), $options: "si" } },
          { deployUserName: { $regex: new RegExp(search), $options: "si" } },
          { warningUserName: { $regex: new RegExp(search), $options: "si" } },
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
      searchQuery.status = statusFilter === "true";
    }

    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let devices;
    const totalCount = await Device.countDocuments(searchQuery);

    if (isNaN(page) || isNaN(limit) || page === 0 || limit === 0) {
      devices = await Device.find(searchQuery)
        .populate({
          path: "division",
          model: "division",
          select: "_id divisionName",
        })
        .populate({
          path: "zone",
          model: "zone",
          select: "_id zoneName",
        })
        .populate({
          path: "location",
          model: "location",
          select: "_id locationName",
        });
    } else {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      devices = await Device.find(searchQuery)
        .populate({
          path: "division",
          model: "division",
          select: "_id divisionName",
        })
        .populate({
          path: "zone",
          model: "zone",
          select: "_id zoneName",
        })
        .populate({
          path: "location",
          model: "location",
          select: "_id locationName",
        })
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

      const result = {};

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

      result.totalCounts = totalCount;
      return res.status(200).send({
        message: "Devices fetched successfully",
        data: devices,
        pagination: result,
      });
    }

    return res.status(200).send({
      message: "Devices fetched successfully",
      data: devices,
      totalCounts: totalCount,
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

    return res
      .status(200)
      .send({ data: device, message: "Device deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getDeviceData = async (req, res) => {
  try {
    const deviceName = req.query.deviceName;
    const device = await Device.findOne({ deviceName })
      .populate({
        path: "location",
        model: "location",
        select: "_id locationName",
      })
      .populate({
        path: "division",
        model: "division",
        select: "_id divisionName",
      })
      .populate({
        path: "zone",
        model: "zone",
        select: "_id zoneName",
      });

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    const trainDataArray = await DynamicModel.find({ key: deviceName });
    if (!trainDataArray.length) {
      return res
        .status(404)
        .json({ message: "No train data found for this device" });
    }

    const trainMap = {};
    const warningResults = {}; 
    const formatTime = (time) => {
      if (!time) return null;
      const { hour, minute, second } = time;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
      )}:${String(second).padStart(2, "0")}`;
    };

    const formatDate = (date) => {
      if (!date) return null;
      const { day, month, year } = date;
      return `${String(day).padStart(2, "0")}/${String(month).padStart(
        2,
        "0"
      )}/${year}`;
    };

    trainDataArray.forEach((train) => {
      const { ID, temperature_arr, sensorStatusArr, SystemState, DT } = train;
      const ambientTemperature =
        Array.isArray(SystemState) && SystemState.length >= 5
          ? SystemState[4]
          : null;

      const formattedDateTime = {
        time: formatTime({
          hour: DT?.[0]?.[0],
          minute: DT?.[0]?.[1],
          second: DT?.[0]?.[2],
        }),
        date: formatDate({
          day: DT?.[1]?.[0],
          month: DT?.[1]?.[1],
          year: DT?.[1]?.[2],
        }),
      };

      const axleData = temperature_arr?.[0] || [];
      const axleDirection =
        axleData.length >= 19 && axleData[17] > axleData[18] ? "Up" : "Down";

      //warning counts for the train
      if (!warningResults[ID]) {
        warningResults[ID] = 0;
      }

      //warning counting 
      const warningHotTemp = parseFloat(device.warningHotTemprature);
      const warningWarmTemp = parseFloat(device.warningWarmTemprature);
      const warningDifferentialTemp = parseFloat(
        device.warningDifferentialTemprature
      );

      const temperatureArr = train.temperature_arr;

      temperatureArr.forEach((axleData) => {
        const leftAxleSensors = axleData.slice(1, 5); // Left side axle sensors
        const rightAxleSensors = axleData.slice(10, 14); // Right side axle sensors
        const leftWheelTemps = axleData.slice(5, 7); // Left side wheel temps
        const rightWheelTemps = axleData.slice(14, 16); // Right side wheel temps
        const leftBrakeTemps = axleData.slice(7, 9); // Left side brake temps
        const rightBrakeTemps = axleData.slice(16, 18); // Right side brake temps

        // Check for left warnings
        leftAxleSensors.forEach((temp) => {
          if (temp >= warningDifferentialTemp) {
            warningResults[ID]++; 
          }
        });

        rightAxleSensors.forEach((temp) => {
          if (temp >= warningDifferentialTemp) {
            warningResults[ID]++;
          }
        });

        //for differential warnings for wheels and brakes
        leftWheelTemps.forEach((temp) => {
          if (temp >= warningDifferentialTemp) {
            warningResults[ID]++; 
          }
        });

        rightWheelTemps.forEach((temp) => {
          if (temp >= warningDifferentialTemp) {
            warningResults[ID]++; 
          }
        });

        leftBrakeTemps.forEach((temp) => {
          if (temp >= warningDifferentialTemp) {
            warningResults[ID]++; 
          }
        });

        rightBrakeTemps.forEach((temp) => {
          if (temp >= warningDifferentialTemp) {
            warningResults[ID]++; 
          }
        });
      });

      if (!trainMap[ID]) {
        const totalAxles = temperature_arr.length;
        const locomotiveAxles = 6;
        const coachAxles = totalAxles - locomotiveAxles;
        const totalCoaches = Math.floor(coachAxles / 4);

        trainMap[ID] = {
          trainID: ID,
          totalAxles: totalAxles,
          totalCoaches: totalCoaches,
          ambientTemperature: ambientTemperature,
          formattedDateTime: formattedDateTime,
          direction: axleDirection,
          warningCounts: warningResults[ID], 
        };
      } else {
        trainMap[ID].totalAxles += temperature_arr.length;
        const locomotiveAxles = 6;
        const coachAxles = trainMap[ID].totalAxles - locomotiveAxles;
        trainMap[ID].totalCoaches = Math.floor(coachAxles / 4);
        trainMap[ID].ambientTemperature = ambientTemperature;
        trainMap[ID].formattedDateTime = formattedDateTime;
        trainMap[ID].direction = axleDirection;
        trainMap[ID].warningCounts = warningResults[ID]; 
      }
    });

    const trainDetails = Object.values(trainMap).map((train) => ({
      trainID: train.trainID,
      totalAxles: train.totalAxles,
      totalCoaches: train.totalCoaches,
      ambientTemperature: train.ambientTemperature,
      location: device.location.locationName,
      division: device.division.divisionName,
      zone: device.zone.zoneName,
      formattedDateTime: train.formattedDateTime,
      direction: train.direction,
      warningCounts: train.warningCounts, 
    }));

    return res.status(200).json({ deviceName, trains: trainDetails });
  } catch (error) {
    console.error("Error in getDeviceData:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

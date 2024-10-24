const Device = require("../model/device");
const Division = require("../model/division");
const DeviceMaintenance = require("../model/deviceMaintenanceModel");
const DeviceTicket = require("../model/deviceTicketModel");
const IssueCode = require("../model/issueCode");
const modelName = "IotCollection";
const mongoose = require("mongoose");
const moment = require("moment");
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
    console.log(limit);

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
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const deviceName = req.query.deviceName;

    // Extract period, startDate, and endDate from query
    const { period, startDate, endDate } = req.query;
    let dateFilter = {};
    let days = 0;

    // Determine the date filter based on period or custom dates
    if (period) {
      if (period === "7") days = 7;
      else if (period === "15") days = 15;
      else if (period === "30") days = 30;
    }

    if (days > 0 || (period === "custom" && startDate && endDate)) {
      let calculatedStartDate, calculatedEndDate;

      if (days > 0) {
        calculatedEndDate = new Date();
        calculatedStartDate = new Date(calculatedEndDate);
        calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
      } else if (period === "custom") {
        calculatedStartDate = new Date(startDate);
        calculatedEndDate = new Date(endDate);
        calculatedEndDate.setHours(23, 59, 59, 999);

        // Validate custom date input
        if (
          isNaN(calculatedStartDate.getTime()) ||
          isNaN(calculatedEndDate.getTime())
        ) {
          return res.status(400).send({ error: "Invalid date format" });
        }

        days = Math.ceil(
          (calculatedEndDate - calculatedStartDate) / (1000 * 60 * 60 * 24)
        );
      }

      // Apply date filter
      dateFilter = {
        createdAt: {
          $gte: calculatedStartDate,
          $lte: calculatedEndDate,
        },
      };
    }
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

    const trainDataArray = await DynamicModel.find({
      key: deviceName,
      ...dateFilter,
    });
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

    const paginatedTrains =
      limit > 0
        ? trainDetails.slice(startIndex, startIndex + limit)
        : trainDetails;
    const totalCounts = trainDetails.length;

    return res.status(200).json({
      deviceName,
      trains: paginatedTrains,
      totalCounts,
      currentPage: page,
      totalPages: Math.ceil(totalCounts / limit) || 1,
    });
  } catch (error) {
    console.error("Error in getDeviceData:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getAllTrainData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const devices = await Device.find()
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

    if (!devices.length) {
      return res.status(404).json({ message: "No devices found" });
    }

    const allTrainData = [];

    for (const device of devices) {
      const trainDataArray = await DynamicModel.find({
        key: device.deviceName,
      });

      if (!trainDataArray.length) {
        continue;
      }

      const trainMap = {};

      const formatTime = (time) => {
        if (!time) return null;
        const { hour, minute, second } = time;
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
      };

      const formatDate = (date) => {
        if (!date) return null;
        const { day, month, year } = date;
        return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      };

      let lastValidDT = {};

      trainDataArray.forEach((train) => {
        const { ID, temperature_arr, SystemState, DT } = train;

        let formattedDateTime = {
          time: null,
          date: null,
        };
        let timestamp = null;

        if (Array.isArray(DT) && DT.length >= 2 && DT[0].length >= 3 && DT[1].length >= 3) {
          formattedDateTime = {
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

          const [day, month, year] = [DT[1][0], DT[1][1] - 1, DT[1][2]];
          const [hour, minute, second] = [DT[0][0], DT[0][1], DT[0][2]];
          timestamp = new Date(year, month, day, hour, minute, second);

          lastValidDT[ID] = { formattedDateTime, timestamp };
        } else {
          console.warn(`Skipping DT for train ID ${ID} due to invalid DT:`, DT);
        }

        const ambientTemperature = Array.isArray(SystemState) && SystemState.length >= 5 ? SystemState[4] : null;

        let maxRightTemp = null;
        let maxLeftTemp = null;

        temperature_arr.forEach((axleData) => {
          const leftAxleTemps = axleData.slice(1, 5);
          const rightAxleTemps = axleData.slice(10, 14);

          const leftMax = Math.max(...leftAxleTemps);
          const rightMax = Math.max(...rightAxleTemps);

          maxLeftTemp = maxLeftTemp !== null ? Math.max(maxLeftTemp, leftMax) : leftMax;
          maxRightTemp = maxRightTemp !== null ? Math.max(maxRightTemp, rightMax) : rightMax;
        });

        const temperatureDifference = maxRightTemp !== null && maxLeftTemp !== null
          ? Math.abs(maxRightTemp - maxLeftTemp)
          : null;

        if (!trainMap[ID]) {
          const totalAxles = temperature_arr.length;
          const locomotiveAxles = 6;
          const coachAxles = totalAxles - locomotiveAxles;
          const totalCoaches = Math.floor(coachAxles / 4);

          trainMap[ID] = {
            trainID: ID,
            axle: totalAxles,
            location: device.location.locationName,
            division: device.division.divisionName,
            zone: device.zone.zoneName,
            formattedDateTime: formattedDateTime,
            RH_Max_Temp: maxRightTemp,
            LH_Max_Temp: maxLeftTemp,
            Difference: temperatureDifference,
            deviceName: device.deviceName,
            timestamp: timestamp,
          };
        } else {
          trainMap[ID].axle += temperature_arr.length;
        }
      });

      Object.keys(trainMap).forEach((trainID) => {
        if (lastValidDT[trainID]) {
          trainMap[trainID].formattedDateTime = lastValidDT[trainID].formattedDateTime;
          trainMap[trainID].timestamp = lastValidDT[trainID].timestamp;
        }
      });

      const trainDetails = Object.values(trainMap).map((train) => ({
        trainID: train.trainID,
        axle: train.axle,
        location: train.location,
        division: train.division,
        zone: train.zone,
        formattedDateTime: train.formattedDateTime,
        RH_Max_Temp: train.RH_Max_Temp,
        LH_Max_Temp: train.LH_Max_Temp,
        Difference: train.Difference,
        deviceName: train.deviceName,
        timestamp: train.timestamp,
      }));

      allTrainData.push(...trainDetails);
    }

    allTrainData.sort((a, b) => a.timestamp - b.timestamp);

    const totalCounts = allTrainData.length;
    const paginatedTrains = limit > 0 ? allTrainData.slice(startIndex, startIndex + limit) : allTrainData;

    return res.status(200).json({
      trains: paginatedTrains,
      totalCounts,
      currentPage: page,
      totalPages: Math.ceil(totalCounts / limit) || 1,
    });
  } catch (error) {
    console.error("Error in getAllTrainData:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getDeviceCounts = async (req, res) => {
  try {
    const currentDate = new Date();
    const firstDayOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastMonthDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const firstDayOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );

    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: true });
    const inactiveDevices = await Device.countDocuments({ status: false });

    const currentMonthTotalDevices = await Device.countDocuments({
      createdAt: { $gte: firstDayOfCurrentMonth },
    });
    const currentMonthActiveDevices = await Device.countDocuments({
      status: true,
      createdAt: { $gte: firstDayOfCurrentMonth },
    });
    const currentMonthInactiveDevices = await Device.countDocuments({
      status: false,
      createdAt: { $gte: firstDayOfCurrentMonth },
    });

    const lastMonthTotalDevices = await Device.countDocuments({
      createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfCurrentMonth },
    });
    const lastMonthActiveDevices = await Device.countDocuments({
      status: true,
      createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfCurrentMonth },
    });
    const lastMonthInactiveDevices = await Device.countDocuments({
      status: false,
      createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfCurrentMonth },
    });

    const calculatePercentageChange = (current, previous) => {
      console.log(current, previous);

      if (previous === 0)
        return {
          percentage: current > 0 ? 100 : 0,
          direction: current >= 0 ? "up" : "down",
        };
      const change = (current - previous) / previous;
      return {
        percentage: Math.abs(change.toFixed(2)),
        direction: change >= 0 ? "up" : "down",
      };
    };

    const totalChange = calculatePercentageChange(
      currentMonthTotalDevices,
      lastMonthTotalDevices
    );
    const activeChange = calculatePercentageChange(
      currentMonthActiveDevices,
      lastMonthActiveDevices
    );
    const inactiveChange = calculatePercentageChange(
      currentMonthInactiveDevices,
      lastMonthInactiveDevices
    );

    return res.status(200).send({
      data: {
        totalDevices,
        activeDevices,
        inactiveDevices,
        changes: {
          totalChange: {
            percentage: totalChange.percentage,
            direction: totalChange.direction,
          },
          activeChange: {
            percentage: activeChange.percentage,
            direction: activeChange.direction,
          },
          inactiveChange: {
            percentage: inactiveChange.percentage,
            direction: inactiveChange.direction,
          },
        },
      },
      message: "Device counts and percentage changes fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getTotalWarningsByMonth = async (req, res) => {
  try {
    const currentYear = moment().year();
    const totalWarningsByMonth = Array(12).fill(0);

    const deviceNameQuery = req.query.deviceName;

    const query = deviceNameQuery ? { deviceName: deviceNameQuery } : {};
    const devices = await Device.find(query);

    for (const device of devices) {
      const trainDataArray = await DynamicModel.find({
        key: device.deviceName,
      });

      for (const train of trainDataArray) {
        const { DT } = train;

        if (Array.isArray(DT) && DT.length > 1) {
          const trainYear = DT[1][2];
          const month = DT[1][1];

          if (trainYear === currentYear) {
            const warningDifferentialTemp = parseFloat(
              device.warningDifferentialTemprature
            );
            let warningCount = 0;
            const temperatureArr = train.temperature_arr;

            temperatureArr.forEach((axleData) => {
              const leftAxleSensors = axleData.slice(1, 5);
              const rightAxleSensors = axleData.slice(10, 14);
              const leftWheelTemps = axleData.slice(5, 7);
              const rightWheelTemps = axleData.slice(14, 16);
              const leftBrakeTemps = axleData.slice(7, 9);
              const rightBrakeTemps = axleData.slice(16, 18);

              [
                leftAxleSensors,
                rightAxleSensors,
                leftWheelTemps,
                rightWheelTemps,
                leftBrakeTemps,
                rightBrakeTemps,
              ].forEach((sensorArray) => {
                sensorArray.forEach((temp) => {
                  if (temp >= warningDifferentialTemp) {
                    warningCount++;
                  }
                });
              });
            });

            totalWarningsByMonth[month - 1] += warningCount;
          }
        }
      }
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const response = {};
    monthNames.forEach((month, index) => {
      response[month] = totalWarningsByMonth[index];
    });

    return res.status(200).json({
      message: "Total warnings for the current year retrieved successfully.",
      data: response,
    });
  } catch (error) {
    console.error("Error in getTotalWarningsByMonth:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getAlertData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const deviceName = req.query.deviceName;

    let query = {};
    if (deviceName) {
      query = { deviceName };
    }

    const devices = await Device.find(query)
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

    if (!devices.length) {
      return res.status(404).json({ message: "No devices found" });
    }

    const alertResults = [];
    
    const formatTime = (time) => {
      if (!time) return null;
      const { hour, minute, second } = time;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
    };

    const formatDate = (date) => {
      if (!date) return null;
      const { day, month, year } = date;
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    };

    for (const device of devices) {
      const trainDataArray = await DynamicModel.find({ key: device.deviceName });
      if (!trainDataArray.length) continue;

      for (const train of trainDataArray) {
        const { sensorStatusArr, DT } = train;

        if (Array.isArray(sensorStatusArr)) {
          const warnings = sensorStatusArr.map((status, index) => (status === 0 ? index + 1 : null)).filter(Boolean);

          if (warnings.length > 0 && DT) {
            const formattedDateTime = `${formatDate({ day: DT[1][0], month: DT[1][1], year: DT[1][2] })} ${formatTime({ hour: DT[0][0], minute: DT[0][1], second: DT[0][2] })}`;

            for (const warning of warnings) {
              const sensorId = await IssueCode.findOne({ componentName: warning }).select("_id");

              const ticket = await DeviceTicket.findOne({ deviceId: device._id, sensor: [sensorId] });

              let action;
              if (ticket) {
                if (ticket.isResolved) {
                  const resolvedDate = new Date(ticket.resolvedDate);
                  const options = { day: "2-digit", month: "short" };
                  const formattedDate = resolvedDate.toLocaleDateString("en-GB", options);
                  action = `Resolved on ${formattedDate}`;
                } else {
                  action = "Ticket Raised";
                }
              } else {
                action = "Raise Ticket";
              }

              const exists = alertResults.some((alert) => alert.warnings === warning && alert.deviceName === device.deviceName);
              
              if (!exists) {
                alertResults.push({
                  deviceName: device.deviceName,
                  locationName: device.location.locationName,
                  divisionName: device.division.divisionName,
                  lastResponseAt: formattedDateTime,
                  warnings: warning,
                  action: action,
                });
              }
            }
          }
        }
      }
    }

    alertResults.sort((a, b) => new Date(b.lastResponseAt) - new Date(a.lastResponseAt));

    const paginatedAlerts = alertResults.slice(startIndex, startIndex + limit);
    const totalCounts = alertResults.length;

    return res.status(200).json({
      deviceName: deviceName || 'All Devices',
      alerts: paginatedAlerts,
      totalCounts,
      currentPage: page,
      totalPages: Math.ceil(totalCounts / limit) || 1,
    });
  } catch (error) {
    console.error("Error in getAlertData:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

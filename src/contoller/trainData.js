const Device = require("../model/device");
const mongoose = require("mongoose");
const moment = require("moment");

const modelName = "IotCollection";
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

exports.getTrainData = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const trainName = req.query.trainName;

    const dynamicData = await DynamicModel.findOne({ ID: trainName });

    let deviceName = dynamicData.key;

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
      ID: trainName,
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

exports.getDTrainIdWarnings = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const trainName = req.query.trainName;

    // Validate that the trainName is provided
    if (!trainName) {
      return res.status(400).json({ error: "trainName is required" });
    }

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
      dateFilter = {
        createdAt: {
          $gte: calculatedStartDate,
          $lte: calculatedEndDate,
        },
      };
    }
    const dynamicData = await DynamicModel.findOne({ ID: trainName });

    if (!dynamicData) {
      return res.status(404).json({ message: "Train not found" });
    }

    const deviceName = dynamicData.key;
    const devices = await Device.find({ deviceName })
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

    if (devices.length === 0) {
      return res.status(404).json({ message: "Device(s) not found" });
    }

    let allWarningResults = [];

    for (const device of devices) {
      const warnings = await DynamicModel.find({
        ID: trainName,
        ...dateFilter,
      });

      const warningHotTemp = parseFloat(device.warningHotTemprature);
      const warningWarmTemp = parseFloat(device.warningWarmTemprature);
      const warningDifferentialTemp = parseFloat(
        device.warningDifferentialTemprature
      );

      let warningResults = [];

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

      const trainDateMap = new Map();
      warnings.forEach((warningData) => {
        const trainNo = warningData.ID;
        const date = warningData.DT;
        if (date) {
          trainDateMap.set(trainNo, {
            time: formatTime({
              hour: date[0][0],
              minute: date[0][1],
              second: date[0][2],
            }),
            date: formatDate({
              day: date[1][0],
              month: date[1][1],
              year: date[1][2],
            }),
          });
        }
      });

      // Process the warnings for the current device
      warnings.forEach((warningData) => {
        const temperatureArr = warningData.temperature_arr;
        const trainNo = warningData.ID;

        const formattedDateTime = trainDateMap.get(trainNo) || {
          time: null,
          date: null,
        };

        let axleCount = 0;

        temperatureArr.forEach((axleData) => {
          const axleNo = axleData[0];
          axleCount++;
          let coachNo =
            axleCount <= 6 ? "Loco" : Math.ceil((axleCount - 6) / 4);

          const leftAxleSensors = axleData.slice(1, 5);
          const rightAxleSensors = axleData.slice(10, 14);
          const leftWheelTemps = axleData.slice(5, 7);
          const rightWheelTemps = axleData.slice(14, 16);
          const leftBrakeTemps = axleData.slice(7, 9);
          const rightBrakeTemps = axleData.slice(16, 18);

          const axleDirection = axleData[17] > axleData[18] ? "up" : "down";

          leftAxleSensors.forEach((temp, index) => {
            let sensorIndex = index + 1;
            if (temp >= warningDifferentialTemp && temp < warningWarmTemp) {
              warningResults.push({
                warning_Type: "Axle Sensor",
                sensorNo: `${sensorIndex}`,
                temp,
                status: "Differential",
                side: "Left",
                axleNo: axleNo,
                trainNo,
                coachNo,
                direction: axleDirection,
                device_Name: device.deviceName,
                location: device.location.locationName,
                division: device.division.divisionName,
                zone: device.zone.zoneName,
                Date_Time: formattedDateTime,
              });
            } else if (temp >= warningWarmTemp && temp < warningHotTemp) {
              warningResults.push({
                warning_Type: "Axle Sensor",
                sensorNo: `${sensorIndex}`,
                temp,
                status: "Warm",
                side: "Left",
                axleNo: axleNo,
                trainNo,
                coachNo,
                direction: axleDirection,
                device_Name: device.deviceName,
                location: device.location.locationName,
                division: device.division.divisionName,
                zone: device.zone.zoneName,
                Date_Time: formattedDateTime,
              });
            } else if (temp >= warningHotTemp) {
              warningResults.push({
                warning_Type: "Axle Sensor",
                sensorNo: `${sensorIndex}`,
                temp,
                status: "Hot",
                side: "Left",
                axleNo: axleNo,
                trainNo,
                coachNo,
                direction: axleDirection,
                device_Name: device.deviceName,
                location: device.location.locationName,
                division: device.division.divisionName,
                zone: device.zone.zoneName,
                Date_Time: formattedDateTime,
              });
            }
          });

          rightAxleSensors.forEach((temp, index) => {
            let sensorIndex = index + 1;
            if (temp >= warningDifferentialTemp && temp < warningWarmTemp) {
              warningResults.push({
                warning_Type: "Axle Sensor",
                sensorNo: `${sensorIndex}`,
                temp,
                status: "Differential",
                side: "Right",
                axleNo: axleNo,
                trainNo,
                coachNo,
                direction: axleDirection,
                device_Name: device.deviceName,
                location: device.location.locationName,
                division: device.division.divisionName,
                zone: device.zone.zoneName,
                Date_Time: formattedDateTime,
              });
            } else if (temp >= warningWarmTemp && temp < warningHotTemp) {
              warningResults.push({
                warning_Type: "Axle Sensor",
                sensorNo: `${sensorIndex}`,
                temp,
                status: "Warm",
                side: "Right",
                axleNo: axleNo,
                trainNo,
                coachNo,
                direction: axleDirection,
                device_Name: device.deviceName,
                location: device.location.locationName,
                division: device.division.divisionName,
                zone: device.zone.zoneName,
                Date_Time: formattedDateTime,
              });
            } else if (temp >= warningHotTemp) {
              warningResults.push({
                warning_Type: "Axle Sensor",
                sensorNo: `${sensorIndex}`,
                temp,
                status: "Hot",
                side: "Right",
                axleNo: axleNo,
                trainNo,
                coachNo,
                direction: axleDirection,
                device_Name: device.deviceName,
                location: device.location.locationName,
                division: device.division.divisionName,
                zone: device.zone.zoneName,
                Date_Time: formattedDateTime,
              });
            }
          });
        });
      });

      allWarningResults = allWarningResults.concat(warningResults);
    }

    const paginatedResults = allWarningResults.slice(startIndex, endIndex);
    const results = {
      totalWarnings: allWarningResults.length,
      currentPage: page,
      totalPages: Math.ceil(allWarningResults.length / limit),
      warnings: paginatedResults,
    };

    return res.status(200).json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getTrainTemp = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const trainName = req.query.trainName;
    if (!trainName) {
      return res.status(400).json({ error: "trainName is required" });
    }
    const dynamicDataList = await DynamicModel.find({ ID: trainName });
    if (!dynamicDataList || dynamicDataList.length === 0) {
      return res.status(404).json({ message: "Train not found" });
    }

    let combinedTemperatureArr = [];
    dynamicDataList.forEach((dynamicData) => {
      combinedTemperatureArr = combinedTemperatureArr.concat(
        dynamicData.temperature_arr
      );
    });

    const totalCount = combinedTemperatureArr.length;

    if (page && limit) {
      const startIndex = (page - 1) * limit;
      combinedTemperatureArr = combinedTemperatureArr.slice(
        startIndex,
        startIndex + limit
      );
    }

    let axlesData = {};

    combinedTemperatureArr.forEach((tempData, index) => {
      const axleNumber = `Axle ${index + 1}`;

      const leftAxleBoxes = tempData.slice(1, 5).sort((a, b) => b - a);
      const rightAxleBoxes = tempData.slice(10, 14).sort((a, b) => b - a);
      const leftWheelBoxes = tempData.slice(5, 7).sort((a, b) => b - a);
      const rightWheelBoxes = tempData.slice(14, 16).sort((a, b) => b - a);
      const leftBrakeBoxes = tempData.slice(7, 9).sort((a, b) => b - a);
      const rightBrakeBoxes = tempData.slice(16, 18).sort((a, b) => b - a);

      const axleBoxDifference = leftAxleBoxes[0] - rightAxleBoxes[0];
      const wheelBoxDifference = leftWheelBoxes[0] - rightWheelBoxes[0];
      const brakeBoxDifference = leftBrakeBoxes[0] - rightBrakeBoxes[0];

      axlesData[axleNumber] = {
        leftAxleBoxes,
        rightAxleBoxes,
        leftWheelBoxes,
        rightWheelBoxes,
        leftBrakeBoxes,
        rightBrakeBoxes,
        differences: {
          axleBoxDifference,
          wheelBoxDifference,
          brakeBoxDifference,
        },
      };
    });

    const results = {
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      axlesData: axlesData,
    };

    return res.status(200).json(results);
  } catch (error) {
    console.log({ error });
    return res.status(500).send({ error: "Something broke" });
  }
};

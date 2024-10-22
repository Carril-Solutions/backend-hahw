const mongoose = require("mongoose");
const DeviceModel = require("../model/device");

exports.createDynamicModelandAddedData = async (req, res) => {
  try {
    const data = req.body;

    if (
      !data ||
      (Array.isArray(data) && data.length === 0) ||
      (!Array.isArray(data) && Object.keys(data).length === 0)
    ) {
      return res.status(400).send({ error: "At least one field is required" });
    }

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
    let savedDocuments;
    if (Array.isArray(data)) {
      savedDocuments = await DynamicModel.insertMany(data);
    } else {
      const newDocument = new DynamicModel(data);
      savedDocuments = await newDocument.save();
    }

    return res.status(201).send({
      message: "Device data has been added successfully",
      data: savedDocuments,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    return res.status(500).send({ error: "Something went wrong" });
  }
};

const transformData = (data) => {
  if (!data) return null;

  let dtData = data.DT;

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

  return {
    id: data._id,
    key: data.key,
    timestamp: data.createdAt,
    temperatureData: data.temperature_arr?.map((item) => ({
      axleNumber: item[0],
      temperatures: item.slice(1, 17),
      proxy1Timestamp: item[17],
      proxy2Timestamp: item[18],
    })),
    sensorStatus: data.sensorStatusArr || [],
    systemState: {
      panelDoorStatus: data.SystemState?.[0] == 0 ? "Closed" : "Open" || null,
      mainPowerStatus: data.SystemState?.[1] == 0 ? "OFF" : "ON" || null,
      smpsStatus: data.SystemState?.[2] == 0 ? "OFF" : "ON" || null,
      batteryPercentage: data.SystemState?.[3] || null,
      tempBoxAmbient1: data.SystemState?.[4] || null,
      tempBoxAmbient2: data.SystemState?.[5] || null,
      tempBoxAmbient3: data.SystemState?.[6] || null,
      tempBoxAmbient4: data.SystemState?.[7] || null,
      panelBoxTemp: data.SystemState?.[8] || null,
      pcbBoxTemp: data.SystemState?.[9] || null,
      batteryTemp: data.SystemState?.[10] || null,
    },
    datetime: {
      time: formatTime({
        hour: dtData != undefined ? dtData?.[0]?.[0] : null,
        minute: dtData != undefined ? dtData?.[0]?.[1] : null,
        second: dtData != undefined ? dtData?.[0]?.[2] : null,
      }),
      date: formatDate({
        day: dtData != undefined ? dtData?.[1]?.[0] : null,
        month: dtData != undefined ? dtData?.[1]?.[1] : null,
        year: dtData != undefined ? dtData?.[1]?.[2] : null,
      }),
    },
  };
};

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

exports.getIotData = async (req, res) => {
  try {
    const { deviceName, train } = req.query;

    const device = await DeviceModel.findOne({ deviceName })
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

    const query = { key: deviceName };
    if (train) {
      query.ID = Number(train);
    }

    const rawDatass = await DynamicModel.find(query);

    if (!rawDatass || rawDatass.length === 0) {
      return res
        .status(200)
        .send({ data: [], success: true, message: "No data available" });
    }

    let systemState;
    let time;
    let date;
    const mergedTemperatureData = rawDatass.reduce((acc, curr) => {
      const transformed = transformData(curr);

      if (transformed && transformed.temperatureData) {
        acc.push(...transformed.temperatureData);
      }
      if (transformed && transformed.systemState) {
        systemState = transformed.systemState;
      }

      if (transformed && transformed.datetime) {
        if (
          transformed.datetime.time &&
          transformed.datetime.time !== "null:null:null"
        ) {
          time = transformed.datetime.time;
        }
        if (
          transformed.datetime.date &&
          transformed.datetime.date !== "null/null/null"
        ) {
          date = date || transformed.datetime.date;
        }
      }
      return acc;
    }, []);
    
    const finalResponse = {
      id: rawDatass[0]._id,
      key: rawDatass[0].key,
      timestamp: rawDatass[0].createdAt,
      temperatureData: mergedTemperatureData,
      sensorStatus: rawDatass.map((item) => item.sensorStatusArr).flat(),
      systemState,
      datetime: {
        time: time || "null:null:null",
        date: date || "null/null/null",
      },
      deviceName: device.deviceName,
      deviceId: device._id,
      location: device.location.locationName,
      division: device.division.divisionName,
      zone: device.zone.zoneName,
    };

    res.status(200).send({ success: true, data: finalResponse });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send({ success: false, error: "Unable to retrieve data" });
  }
};

exports.getDeviceWarnings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const deviceName = req.query.deviceName || null;

    const deviceQuery = deviceName ? { deviceName } : {};
    const devices = await DeviceModel.find(deviceQuery)
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
      const warnings = await DynamicModel.find({ key: device.deviceName });
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
          let coachNo = axleCount <= 6 ? "Loco" : Math.ceil((axleCount - 6) / 4);

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

        // Differential warnings for wheels and brakes
        leftWheelTemps.forEach((temp, index) => {
          if (temp >= warningDifferentialTemp) {
            warningResults.push({
              warning_Type: "Wheel",
              sensorNo: `${index + 1}`,
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
          }
        });

        rightWheelTemps.forEach((temp, index) => {
          if (temp >= warningDifferentialTemp) {
            warningResults.push({
              warning_Type: "Wheel",
              sensorNo: `${index + 1}`,
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
          }
        });

        leftBrakeTemps.forEach((temp, index) => {
          if (temp >= warningDifferentialTemp) {
            warningResults.push({
              warning_Type: "Brake",
              sensorNo: `${index + 1}`,
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
          }
        });

        rightBrakeTemps.forEach((temp, index) => {
          if (temp >= warningDifferentialTemp) {
            warningResults.push({
              warning_Type: "Brake",
              sensorNo: `${index + 1}`,
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
          }
        });
      });
    });
      allWarningResults = [...allWarningResults, ...warningResults];
    }

    const totalCounts = allWarningResults.length;
    const totalPages = Math.ceil(totalCounts / limit);

    const responseMessage = totalCounts > 0 ? "Warnings found" : "No warnings";

    if (isNaN(page) || isNaN(limit)) {
      return res.status(200).json({
        message: responseMessage,
        allWarningResults,
        totalCounts,
        currentPage: page,
        totalPages: 1,
      });
    } else {
      const paginatedResults = allWarningResults.slice(startIndex, endIndex);
      return res.status(200).json({
        message: responseMessage,
        allWarningResults: paginatedResults,
        totalCounts,
        currentPage: page,
        totalPages,
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

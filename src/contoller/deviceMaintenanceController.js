const DeviceMaintenance = require("../model/deviceMaintenanceModel");
const Device = require('../model/device');
const { validateFields, validateFound, validateId } = require("../validatores/commonValidations");
const cron = require('node-cron');

exports.createDeviceMaintenance = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to create" });
        }
        const { deviceId, status, maintainDate, engineerName, contactNumber, engineerEmail } = req.body;

        if (!deviceId || !status) {
            return validateFields(res);
        }

        const data = { deviceId, status, maintainDate, engineerName, contactNumber, engineerEmail };
        const maintenanceRecord = await DeviceMaintenance.create(data);

        return res.status(201).send({ data: maintenanceRecord, message: "Device maintenance created successfully" });
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

exports.getAllDeviceMaintenance = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to view" });
        }

        const { fromDate, toDate, status, deviceId } = req.query;

        if (!deviceId) {
            return res.status(400).send({ error: "deviceId is required." });
        }

        let filter = { deviceId };

        if (fromDate || toDate) {
            filter.maintainDate = {};
            if (fromDate) filter.maintainDate.$gte = new Date(fromDate);
            if (toDate) filter.maintainDate.$lte = new Date(toDate);
        }

        if (status) {
            filter.status = status;
        }

        const maintenanceRecords = await DeviceMaintenance.find(filter).sort({ createdAt: -1 });

        return res.status(200).send({
            message: "Device maintenance records fetched successfully",
            data: maintenanceRecords
        });
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


exports.updateDeviceMaintenance = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to update" });
        }
        const maintenanceId = req.params.maintenanceId;
        if (!maintenanceId) {
            return validateId(res);
        }

        const maintenanceRecord = await DeviceMaintenance.findById(maintenanceId);
        if (!maintenanceRecord) {
            return validateFound(res);
        }

        const { status, maintainDate, engineerName, engineerEmail, contactNumber } = req.body;
        if (status) maintenanceRecord.status = status;
        if (maintainDate) maintenanceRecord.maintainDate = maintainDate;
        if (engineerName) maintenanceRecord.engineerName = engineerName;
        if (contactNumber) maintenanceRecord.contactNumber = contactNumber;
        if (engineerEmail) maintenanceRecord.engineerEmail = engineerEmail;

        await maintenanceRecord.save();
        return res.status(200).send({ data: maintenanceRecord, message: "Device maintenance updated successfully" });
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

exports.updateDeviceMaintenanceStatus = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to update status" });
        }
        const maintenanceId = req.params.maintenanceId;
        if (!maintenanceId) {
            return validateId(res);
        }

        const maintenanceRecord = await DeviceMaintenance.findById(maintenanceId);
        if (!maintenanceRecord) {
            return validateFound(res);
        }

        const newStatus = req.body.status;
        maintenanceRecord.status = newStatus;

        await maintenanceRecord.save();
        return res.status(200).send({ data: maintenanceRecord, message: "Device maintenance status updated successfully" });
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

exports.deleteDeviceMaintenance = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to delete" });
        }
        const maintenanceId = req.params.maintenanceId;
        if (!maintenanceId) {
            return validateId(res);
        }

        const maintenanceRecord = await DeviceMaintenance.findByIdAndDelete(maintenanceId);
        if (!maintenanceRecord) {
            return validateFound(res);
        }

        return res.status(200).send({ data: maintenanceRecord, message: "Device maintenance deleted successfully" });
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

exports.getMaintenanceRecords = async (req, res) => {
    try {
      const upcomingMaintenanceRecords = await DeviceMaintenance.find({
        status: 'Upcoming Maintenance'
      })
        .sort({ maintainDate: 1 })
        .limit(5);
  
      const maintenanceDoneRecords = await DeviceMaintenance.find({
        status: 'Maintenance Done'
      })
        .sort({ maintainDate: -1 })
        .limit(5);
  
      const dueDateRecords = await DeviceMaintenance.find({
        maintainDate: { $lt: new Date() }
      })
        .sort({ maintainDate: 1 })
        .limit(5);
  
      const responseData = {
        upcomingMaintenance: upcomingMaintenanceRecords,
        maintenanceDone: maintenanceDoneRecords,
        dueDate: dueDateRecords,
      };
  
      if (
        !upcomingMaintenanceRecords.length &&
        !maintenanceDoneRecords.length &&
        !dueDateRecords.length
      ) {
        return res.status(404).json({ message: "No maintenance records found." });
      }
  
      return res.status(200).json({
        message: "Maintenance records retrieved successfully.",
        data: responseData,
      });
    } catch (error) {
      console.error("Error retrieving maintenance records:", error);
      return res.status(500).json({ error: "Something went wrong while retrieving records." });
    }
  };

  cron.schedule('* * * * *', async () => {
    try {
        const today = new Date();
        const upcomingMaintenanceRecords = await DeviceMaintenance.find({
            status: 'Upcoming Maintenance',
            maintainDate: { $gt: today }
        });

        for (const record of upcomingMaintenanceRecords) {
            if (record.maintainDate < today) {
                record.status = 'Maintenance Not Done';
                await record.save();
            }
        }

        const devices = await Device.find({ status: true });

        for (const device of devices) {
            const deployDate = new Date(device.deployDate);

            if (deployDate <= today) {
                const existingUpcoming = await DeviceMaintenance.findOne({
                    deviceId: device._id,
                    status: 'Upcoming Maintenance',
                    maintainDate: { $gt: today } 
                });

                if (existingUpcoming) {
                    console.log(`Existing upcoming maintenance found for device ID: ${device._id}. No new entry created.`);
                    continue; 
                }

                const lastMaintenance = await DeviceMaintenance.findOne({
                    deviceId: device._id,
                    status: 'Maintenance Done',
                    maintainDate: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
                });

                if (!lastMaintenance) {
                    const newMaintainDate = new Date(deployDate.getTime() + (30 * 24 * 60 * 60 * 1000));

                    const existingWithSameDate = await DeviceMaintenance.findOne({
                        deviceId: device._id,
                        maintainDate: newMaintainDate
                    });

                    if (!existingWithSameDate) {
                        const newMaintenanceData = {
                            deviceId: device._id,
                            status: 'Upcoming Maintenance',
                            maintainDate: newMaintainDate,
                            engineerName: null,
                            contactNumber: null,
                            engineerEmail: null
                        };

                        await DeviceMaintenance.create(newMaintenanceData);
                        console.log(`New maintenance entry created for device ID: ${device._id} based on deploy date: ${deployDate}`);
                    } else {
                        console.log(`An entry with the same maintain date already exists for device ID: ${device._id}. No new entry created.`);
                    }
                } else {
                    console.log(`Maintenance done recently for device ID: ${device._id}. No new entry created.`);
                }
            }
        }
    } catch (error) {
        console.error("Error checking and creating maintenance records:", error);
    }
});
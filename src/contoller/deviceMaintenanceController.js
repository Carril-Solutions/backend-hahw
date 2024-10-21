const DeviceMaintenance = require("../model/deviceMaintenanceModel");
const { validateFields, validateFound, validateId } = require("../validatores/commonValidations");

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

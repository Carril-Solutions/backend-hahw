const DeviceTicket = require("../model/deviceTicketModel");
const { validateFields, validateFound, validateId } = require("../validatores/commonValidations");

exports.createDeviceTicket = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to create" });
        }
        const { deviceId, remark, sensor, location } = req.body;

        if (!deviceId || !sensor || !location || !remark ) {
            return validateFields(res);
        }

        const data = { deviceId, remark, sensor, location };
        const ticketRecord = await DeviceTicket.create(data);

        return res.status(201).send({ data: ticketRecord, message: "Device ticket created successfully" });
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

exports.getAllDeviceTickets = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to view" });
        }

        const { deviceId, status, fromDate, toDate } = req.query;

        if (!deviceId) {
            return res.status(400).send({ error: "deviceId is required." });
        }

        let filter = { deviceId };

        if (status) {
            filter.status = status;
        }

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const ticketRecords = await DeviceTicket
            .find(filter)
            .sort({ createdAt: -1 })
            .populate({
                path: "deviceId",
                model: "device",
                select: "_id deviceName",
            })
            .populate({
                path: "location",
                model: "location",
                select: "_id locationName",
            })
            .populate({
                path: "sensor",
                model: "issuecode",
                select: "_id componentName",
            });

        return res.status(200).send({
            message: "Device ticket records fetched successfully",
            data: ticketRecords
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

exports.updateDeviceTicket = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to update" });
        }
        const ticketId = req.params.ticketId;
        if (!ticketId) {
            return validateId(res);
        }

        const ticketRecord = await DeviceTicket.findById(ticketId);
        if (!ticketRecord) {
            return validateFound(res);
        }

        const { status, remark, engineerName, engineerEmail, contactNumber, sensor, location } = req.body;
        if (status) ticketRecord.status = status;
        if (remark) ticketRecord.remark = remark;
        if (engineerName) ticketRecord.engineerName = engineerName;
        if (engineerEmail) ticketRecord.engineerEmail = engineerEmail;
        if (contactNumber) ticketRecord.contactNumber = contactNumber;
        if (sensor) ticketRecord.sensor = sensor;
        if (location) ticketRecord.location = location;
        ticketRecord.isResolved = true;
        ticketRecord.resolvedDate = new Date();

        await ticketRecord.save();
        return res.status(200).send({ data: ticketRecord, message: "Device ticket updated successfully" });
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

exports.updateDeviceTicketStatus = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to update status" });
        }
        const ticketId = req.params.ticketId;
        if (!ticketId) {
            return validateId(res);
        }

        const ticketRecord = await DeviceTicket.findById(ticketId);
        if (!ticketRecord) {
            return validateFound(res);
        }

        const newStatus = req.body.status;
        ticketRecord.status = newStatus;
        ticketRecord.isResolved = true;
        ticketRecord.resolvedDate = new Date();

        await ticketRecord.save();
        return res.status(200).send({ data: ticketRecord, message: "Device ticket status updated successfully" });
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

exports.deleteDeviceTicket = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).send({ error: "Unauthorized to delete" });
        }
        const ticketId = req.params.ticketId;
        if (!ticketId) {
            return validateId(res);
        }

        const ticketRecord = await DeviceTicket.findByIdAndDelete(ticketId);
        if (!ticketRecord) {
            return validateFound(res);
        }

        return res.status(200).send({ data: ticketRecord, message: "Device ticket deleted successfully" });
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

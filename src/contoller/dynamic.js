const mongoose = require('mongoose');

exports.createDynamicModelandAddedData = async (req, res) => {
    try {
        const data = req.body;

        if (!data || (Array.isArray(data) && data.length === 0) || (!Array.isArray(data) && Object.keys(data).length === 0)) {
            return res.status(400).send({ error: "At least one field is required" });
        }

        const modelName = 'IotCollection';

        let DynamicModel;
        if (mongoose.models[modelName]) {
            DynamicModel = mongoose.models[modelName];
        } else {
            const dynamicSchema = new mongoose.Schema({}, { strict: false });
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

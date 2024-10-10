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
            const dynamicSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
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

    const formatTime = (time) => {
        if (!time) return null;
        const { hour, minute, second } = time;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    };

    const formatDate = (date) => {
        if (!date) return null;
        const { day, month, year } = date;
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    };

    return {
        id: data._id,
        key: data.key,
        timestamp: data.createdAt,
        temperatureData: data.temperature_arr?.map((item) => ({
            axleNumber: item[0],
            temperatures: item.slice(1, 17),
            proxy1Timestamp: item[17],
            proxy2Timestamp: item[18]
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
            batteryTemp: data.SystemState?.[10] || null
        },
        datetime: {
            time: formatTime({
                hour: data.DT?.[0]?.[0] || null,
                minute: data.DT?.[0]?.[1] || null,
                second: data.DT?.[0]?.[2] || null
            }),
            date: formatDate({
                day: data.DT?.[1]?.[0] || null,
                month: data.DT?.[1]?.[1] || null,
                year: data.DT?.[1]?.[2] || null
            })
        }
    };
};

const modelName = 'IotCollection';
let DynamicModel;

if (mongoose.models[modelName]) {
    DynamicModel = mongoose.models[modelName];
} else {
    const dynamicSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
    DynamicModel = mongoose.model(modelName, dynamicSchema);
}

exports.getIotData = async (req, res) => {
    try {
        const deviceId = req.params.deviceId;
        const rawDatass = await DynamicModel.find({ key: deviceId });
        
        if (!rawDatass || rawDatass.length === 0) {
            return res.status(404).send({ success: false, message: 'No data found' });
        }

        let systemState;
        let datetime;
        const mergedTemperatureData = rawDatass.reduce((acc, curr) => {
            const transformed = transformData(curr);
            if (transformed && transformed.temperatureData) {
                acc.push(...transformed.temperatureData); 
            }
            systemState = transformed.systemState;
            datetime = transformed.datetime;
            return acc;
        }, []);
        

        const finalResponse = {
            id: rawDatass[0]._id,
            key: rawDatass[0].key,
            timestamp: rawDatass[0].createdAt,
            temperatureData: mergedTemperatureData,
            sensorStatus: rawDatass.map(item => item.sensorStatusArr).flat(),
            systemState,
            datetime:datetime
        };

        res.status(200).send({ success: true, data: finalResponse });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ success: false, error: "Unable to retrieve data" });
    }
};

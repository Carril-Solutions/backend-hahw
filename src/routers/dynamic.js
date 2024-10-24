const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/dynamic");

router.post("/iot-data", ctrl.createDynamicModelandAddedData);
router.get("/get-iot-data", ctrl.getIotData); 
router.get("/deviceWarnings", ctrl.getDeviceWarnings); 

module.exports = router
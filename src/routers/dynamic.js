const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/dynamic");

router.post("/iot-data", ctrl.createDynamicModelandAddedData);

module.exports = router
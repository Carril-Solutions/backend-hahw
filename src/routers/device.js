const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/device");
const {verifyJwtToken} = require("../middlewares/auth");

router.post("/addDevice", verifyJwtToken, ctrl.createDevice);
router.put("/updateDevice/:deviceId", verifyJwtToken, verifyJwtToken, ctrl.updateDevice);
router.get("/devices", verifyJwtToken, ctrl.getDevice);
router.patch("/updateDeviceStatus/:deviceId", verifyJwtToken, ctrl.updateDeviceStatus);
router.delete("/deleteDevice/:deviceId", verifyJwtToken, ctrl.deleteDevice);

module.exports = router
const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/device");
const {verifyJwtToken} = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/addDevice", verifyJwtToken, checkPermission("add device"), ctrl.createDevice);
router.put("/updateDevice/:deviceId", verifyJwtToken, checkPermission("update device"), ctrl.updateDevice);
router.get("/devices", verifyJwtToken, checkPermission("view devices"), ctrl.getDevice);
router.patch("/updateDeviceStatus/:deviceId", verifyJwtToken, checkPermission("update device status"), ctrl.updateDeviceStatus);
router.delete("/deleteDevice/:deviceId", verifyJwtToken, checkPermission("delete device"), ctrl.deleteDevice);

module.exports = router
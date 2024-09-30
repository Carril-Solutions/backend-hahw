const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/device");
const {verifyJwtToken} = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/addDevice", verifyJwtToken, checkPermission("Add device"), ctrl.createDevice);
router.put("/updateDevice/:deviceId", verifyJwtToken, checkPermission("Update device"), verifyJwtToken, ctrl.updateDevice);
router.get("/devices", verifyJwtToken, checkPermission("View devices"), ctrl.getDevice);
router.patch("/updateDeviceStatus/:deviceId", verifyJwtToken, checkPermission("Update device status"), ctrl.updateDeviceStatus);
router.delete("/deleteDevice/:deviceId", verifyJwtToken, checkPermission("Delete device"), ctrl.deleteDevice);

module.exports = router
const express = require("express");
const router = express.Router();
const ctrl = require("../contoller/deviceMaintenanceController");
const { verifyJwtToken } = require("../middlewares/auth");

router.post("/addDeviceMaintenance", verifyJwtToken, ctrl.createDeviceMaintenance);
router.get("/deviceMaintenance", verifyJwtToken, ctrl.getAllDeviceMaintenance);
router.put("/updateDeviceMaintenance/:maintenanceId", verifyJwtToken, ctrl.updateDeviceMaintenance);
router.patch("/updateDeviceMaintenanceStatus/:maintenanceId", verifyJwtToken, ctrl.updateDeviceMaintenanceStatus);
router.delete("/deleteDeviceMaintenance/:maintenanceId", verifyJwtToken, ctrl.deleteDeviceMaintenance);

module.exports = router;

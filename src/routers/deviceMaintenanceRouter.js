const express = require("express");
const router = express.Router();
const ctrl = require("../contoller/deviceMaintenanceController");
const { verifyJwtToken } = require("../middlewares/auth");

router.post("/addDeviceMaintenance", ctrl.createDeviceMaintenance);
router.get("/deviceMaintenance", ctrl.getAllDeviceMaintenance);
router.put("/updateDeviceMaintenance/:maintenanceId", ctrl.updateDeviceMaintenance);
router.patch("/updateDeviceMaintenanceStatus/:maintenanceId", ctrl.updateDeviceMaintenanceStatus);
router.delete("/deleteDeviceMaintenance/:maintenanceId", ctrl.deleteDeviceMaintenance);
router.get('/upcoming-maintenance', ctrl.getMaintenanceRecords);

module.exports = router;

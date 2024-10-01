const express = require("express");
const router = express.Router();


const ctrl = require("../contoller/zone");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/addZone", verifyJwtToken, checkPermission("add zone"), ctrl.createZone);
router.get("/zones", verifyJwtToken, checkPermission("view zones"), ctrl.getZone);
router.put("/updateZone/:zoneId", verifyJwtToken, checkPermission("update zone"), ctrl.updateZone);
router.patch("/updateZoneStatus/:zoneId", verifyJwtToken, checkPermission("view zone status"), ctrl.updateZoneStatus);
router.delete("/deleteZone/:zoneId", verifyJwtToken, checkPermission("delete zone"), ctrl.deleteZone);


module.exports = router 
const express = require("express");
const router = express.Router();


const ctrl = require("../contoller/zone");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");


router.post("/addZone", verifyJwtToken, ctrl.createZone);
router.get("/zones", verifyJwtToken, ctrl.getZone);
router.put("/updateZone/:zoneId", verifyJwtToken, ctrl.updateZone);
router.patch("/updateZoneStatus/:zoneId", verifyJwtToken, ctrl.updateZoneStatus);
router.delete("/deleteZone/:zoneId", verifyJwtToken, ctrl.deleteZone);


module.exports = router 
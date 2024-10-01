const express = require("express");
const router = express.Router();

const ctrl = require("../contoller/location");

const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");    
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/addLocation", verifyJwtToken, checkPermission("add location"), ctrl.createLocation);
router.get("/locations", verifyJwtToken, checkPermission("view locations"), ctrl.getLocation);
router.put("/updateLocation/:locationId", verifyJwtToken, checkPermission("update location"), ctrl.updateLocation);
router.patch("/updateLocationStatus/:locationId", verifyJwtToken, checkPermission("update location status"), ctrl.updateLocationStatus);
router.delete("/deleteLocation/:locationId", verifyJwtToken, checkPermission("delete location"), ctrl.deleteLocation);


module.exports = router
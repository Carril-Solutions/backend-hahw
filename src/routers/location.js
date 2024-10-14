const express = require("express");
const router = express.Router();

const ctrl = require("../contoller/location");

const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");    

router.post("/addLocation", verifyJwtToken, ctrl.createLocation);
router.get("/locations", verifyJwtToken, ctrl.getLocation);
router.put("/updateLocation/:locationId", verifyJwtToken, ctrl.updateLocation);
router.patch("/updateLocationStatus/:locationId", verifyJwtToken, ctrl.updateLocationStatus);
router.delete("/deleteLocation/:locationId", verifyJwtToken, ctrl.deleteLocation);


module.exports = router
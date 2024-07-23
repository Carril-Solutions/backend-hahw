const express = require("express");
const router = express.Router();

const ctrl = require("../contoller/userController");

const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");

router.post("/create", verifyOptionalJwtToken, ctrl.createUser);
router.post("/admin", ctrl.createAdmin);
router.get("/users", verifyJwtToken, ctrl.getUser);
router.get("/user/:userId", verifyJwtToken, ctrl.getUserDetails);
router.put("/update/:userId", verifyJwtToken, ctrl.updateUser);
router.patch("/updateStatus/:userId", verifyJwtToken, ctrl.updateUserStatus);
router.delete("/delete/:userId", verifyJwtToken, ctrl.deleteUser);


//get selected details
router.get("/selectRole", verifyJwtToken, ctrl.getSelectedRoles);
router.get("/selectDivision", verifyJwtToken, ctrl.getSelectedDivisions);
router.get("/selectLocation", verifyJwtToken, ctrl.getSelectedLocations);
router.get("/selectZone", verifyJwtToken, ctrl.getSelectedZones);

module.exports = router
const express = require("express");
const router = express.Router();
const ctrl = require("../contoller/auth");

const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");

router.post("/login", ctrl.loginUser);
router.post("/forgotPassword", ctrl.forgotPassword);
router.post("/resetPassword", ctrl.resetPassword);

//fetch user profile
router.get("/profile", verifyJwtToken, ctrl.profile);

module.exports = router
const express = require("express");
const router = express.Router();
const ctrl = require("../contoller/auth");


router.post("/login", ctrl.loginUser);
router.post("/forgotPassword", ctrl.forgotPassword);
router.post("/resetPassword", ctrl.resetPassword);

module.exports = router
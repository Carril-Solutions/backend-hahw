const express = require("express");
const router = express.Router();

const ctrl = require("../contoller/trainData");
const { verifyJwtToken } = require("../middlewares/auth");

router.get("/trainWarningsById", ctrl.getDTrainIdWarnings);
router.get("/trainIddata", ctrl.getTrainData);

module.exports = router;

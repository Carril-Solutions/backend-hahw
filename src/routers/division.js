const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/division");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/addDivision", verifyJwtToken, checkPermission("add division"), ctrl.createDivision);
router.get("/divisions", verifyJwtToken, checkPermission("view divisions"), ctrl.getDivision);
router.put("/updateDivision/:divisionId", verifyJwtToken, checkPermission("update division"), ctrl.updateDivision);
router.patch("/updateDivisionStatus/:divisionId", verifyJwtToken, checkPermission("update division status"), ctrl.updateDivisionStatus);
router.delete("/deleteDivision/:divisionId", verifyJwtToken, checkPermission("delete division"), ctrl.deleteDivision)

module.exports = router
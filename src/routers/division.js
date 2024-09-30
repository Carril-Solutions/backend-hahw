const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/division");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/addDivision", verifyJwtToken, checkPermission("Add division"), ctrl.createDivision);
router.get("/divisions", verifyJwtToken, checkPermission("View divisions"), ctrl.getDivision);
router.put("/updateDivision/:divisionId", checkPermission("Update division"), verifyJwtToken, ctrl.updateDivision);
router.patch("/updateDivisionStatus/:divisionId", verifyJwtToken, checkPermission("Update division status"), ctrl.updateDivisionStatus);
router.delete("/deleteDivision/:divisionId", verifyJwtToken, checkPermission("Delete division"), ctrl.deleteDivision);



module.exports = router
const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/division");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");

router.post("/addDivision", verifyJwtToken, ctrl.createDivision);
router.get("/divisions", verifyJwtToken, ctrl.getDivision);
router.put("/updateDivision/:divisionId", verifyJwtToken, ctrl.updateDivision);
router.patch("/updateDivisionStatus/:divisionId", verifyJwtToken, ctrl.updateDivisionStatus);
router.delete("/deleteDivision/:divisionId", verifyJwtToken, ctrl.deleteDivision);



module.exports = router
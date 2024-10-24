const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/issueCode");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");

router.post("/addIssueCode", verifyJwtToken, ctrl.addIssueCode);
router.get("/issueCodes", verifyJwtToken, ctrl.getIssueCode);
router.put("/updateIssueCode/:issueCodeId", verifyJwtToken, ctrl.updateIssueCode);
//for update status
router.put("/updateIssueCodeStatus/:issueCodeId", verifyJwtToken, ctrl.updateIssueCodeStatus);
router.delete("/deleteIssueCode/:issueCodeId", verifyJwtToken, ctrl.deleteIssueCode);   

module.exports = router
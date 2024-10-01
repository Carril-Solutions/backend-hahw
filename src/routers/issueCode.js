const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/issueCode");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/addIssueCode", verifyJwtToken, checkPermission("add issuecode"), ctrl.addIssueCode);
router.get("/issueCodes", verifyJwtToken, checkPermission("view issuecodes"), ctrl.getIssueCode);
router.put("/updateIssueCode/:issueCodeId", verifyJwtToken, checkPermission("update issuecode"), ctrl.updateIssueCode);
//for update status
router.patch("/updateIssueCodeStatus/:issueCodeId", verifyJwtToken, checkPermission("update issuecode status"), ctrl.updateIssueCodeStatus);
router.delete("/deleteIssueCode/:issueCodeId", verifyJwtToken, checkPermission("delete issuecode"), ctrl.deleteIssueCode);   

module.exports = router
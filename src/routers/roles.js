const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/role");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/checkPermission");

router.post("/addRole", verifyJwtToken, checkPermission("add role"), ctrl.createRole);
router.get("/roles", verifyJwtToken, checkPermission("view roles"), ctrl.getRole);
router.put("/updateRole/:roleId", verifyJwtToken, checkPermission("update role"), ctrl.updateRole);
router.patch("/updateRoleStatus/:roleId", verifyJwtToken, checkPermission("update role status"), ctrl.updateRoleStatus);
router.delete("/deleteRole/:roleId", verifyJwtToken, checkPermission("delete role"), ctrl.deleteRole);


//update Role Permissions
router.patch("/permission/:roleId", verifyJwtToken, ctrl.allowPermission);

module.exports = router
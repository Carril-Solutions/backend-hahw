const express = require("express");
const router = express.Router();    

const ctrl = require("../contoller/role");
const {verifyJwtToken, verifyOptionalJwtToken} = require("../middlewares/auth");

router.post("/addRole", verifyJwtToken, ctrl.createRole);
router.get("/roles", verifyJwtToken, ctrl.getRole);
router.put("/updateRole/:roleId", verifyJwtToken, ctrl.updateRole);
router.patch("/updateRoleStatus/:roleId", verifyJwtToken, ctrl.updateRoleStatus);
router.delete("/deleteRole/:roleId", verifyJwtToken, ctrl.deleteRole);


//update Role Permissions
router.patch("/permission/:roleId", verifyJwtToken, ctrl.allowPermission);




module.exports = router
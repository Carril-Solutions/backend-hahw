const express = require('express');
const router = express.Router();
const permissionController = require('../contoller/permissionController');
const { verifyJwtToken } = require("../middlewares/auth");


router.post('/addPermission', verifyJwtToken, permissionController.createPermission);
router.put('/updatePermission/:permissionId',verifyJwtToken,  permissionController.updatePermission);
router.get('/permissions',verifyJwtToken, permissionController.getPermission);
router.delete('/deletePermission/:permissionId',verifyJwtToken, permissionController.deletePermission);

module.exports = router
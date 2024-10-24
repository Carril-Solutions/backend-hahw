const express = require("express");
const router = express.Router();
const ctrl = require("../contoller/deviceTicketController");
const { verifyJwtToken } = require("../middlewares/auth");

router.post("/addDeviceTicket", verifyJwtToken, ctrl.createDeviceTicket);
router.get("/deviceTickets", verifyJwtToken, ctrl.getAllDeviceTickets);
router.put("/updateDeviceTicket/:ticketId", verifyJwtToken, ctrl.updateDeviceTicket);
router.patch("/updateDeviceTicketStatus/:ticketId", verifyJwtToken, ctrl.updateDeviceTicketStatus);
router.delete("/deleteDeviceTicket/:ticketId", verifyJwtToken, ctrl.deleteDeviceTicket);

router.get('/device-tickets-alert', verifyJwtToken, ctrl.getLatestDeviceTicket);


module.exports = router;

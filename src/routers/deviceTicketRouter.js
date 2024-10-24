const express = require("express");
const router = express.Router();
const ctrl = require("../contoller/deviceTicketController");
const { verifyJwtToken } = require("../middlewares/auth");

router.post("/addDeviceTicket", ctrl.createDeviceTicket);
router.get("/deviceTickets", ctrl.getAllDeviceTickets);
router.put("/updateDeviceTicket/:ticketId", ctrl.updateDeviceTicket);
router.patch("/updateDeviceTicketStatus/:ticketId", ctrl.updateDeviceTicketStatus);
router.delete("/deleteDeviceTicket/:ticketId", ctrl.deleteDeviceTicket);

router.get('/device-tickets-alert', ctrl.getLatestDeviceTicket);


module.exports = router;

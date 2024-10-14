const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const DeviceMaintenance = require("./src/model/deviceMaintenanceModel");

const app = express();

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 8000;

//Adding Database
mongoose.set("strictQuery", false);
mongoose
  .connect(
    process.env.ENV_STATUS === "production"
      ? process.env.DATABASE
      : process.env.LOCAL_DATABASE
  )
  .then(() => console.log("**Database Connected**"))
  .catch((err) => console.log("Error from Database", err));

// applying Middleware
app.use(cors());
app.use(express.json({ limit: "1024mb" }));
app.use(morgan("dev"));
app.use(cookieParser());

const sessionStorage = MongoStore.create({
  mongoUrl:
    process.env.ENV_STATUS === "production"
      ? process.env.DATABASE
      : process.env.LOCAL_DATABASE,
  dbName: "carrel",
  collectionName: "sessions",
  ttl: 14 * 24 * 60 * 60,
  autoRemove: "interval",
  autoRemoveInterval: 10,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    resave: false,
    store: sessionStorage,
  })
);

const server = http.createServer(app);
const io = new Server(server);

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});

// setup the logger
app.use(morgan("combined", { stream: accessLogStream }));

// fs.readdirSync("./routers").map((r) => {
//     app.use("/api", require(`./routers/${r}`));
// });
 

fs.readdirSync(path.join(__dirname, 'src', 'routers')).map((r) => {
  app.use("/api", require(path.join(__dirname, 'src', 'routers', r)));
});

const adminSockets = {};

io.on('connection', (socket) => {
  socket.on('registerAdmin', (adminId) => {
    adminSockets[adminId] = socket;
  });

  socket.on('error', (error) => {
    console.error("Socket error:", error);
  });

  socket.on('disconnect', () => {
    for (const adminId in adminSockets) {
      if (adminSockets[adminId] === socket) {
        delete adminSockets[adminId];
        break;
      }
    }
  });
});

exports.scheduleMaintenanceNotifications = async () => {
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  try {
    const reminders = await DeviceMaintenance.find({
      maintainDate: {
        $gte: today,
        $lte: threeDaysFromNow,
      },
      status: "Upcoming Maintenance",
    }).populate({
      path: "deviceId",
      model: "device",
      select: "_id deviceName",
    });

    reminders.forEach(reminder => {
      const adminId = reminder.adminId.toString();
      console.log("🚀 ~ exports.scheduleMaintenanceNotifications= ~ adminId:", adminId)
      const socket = adminSockets[adminId];
      console.log("🚀 ~ exports.scheduleMaintenanceNotifications= ~ socket:", socket)
      
      if (socket) {
        console.log(`Reminder: Maintenance for ${reminder?.deviceId?.deviceName} is due on ${reminder?.maintainDate}, a ticket should be create for maintenance.`)
        socket.emit('maintenanceReminder', {
          message: `Reminder: Maintenance for ${reminder?.deviceId?.deviceName} is due on ${reminder?.maintainDate}, a ticket should be create for maintenance.`,
        });
      }
    });
    
  } catch (error) {
    console.error("Error fetching reminders:", error);
  }
};

cron.schedule(`* * * * *`, exports.scheduleMaintenanceNotifications);

app.get("/api", async (req, res) => {
  res.json({ ok: true, message: "Great day!" });
});

server.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
  console.log(`Socket.io is available at http://localhost:${PORT}/socket.io/`);
});

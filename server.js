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


app.get("/api", async (req, res) => {
    res.json({ ok: true, message: "Great day!" });
  });

app.listen(PORT, () => {
    console.log(`app is running on ${PORT}`);
});

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { connectToDB } = require("./config/dbConnect");
const { errorHandler } = require("./middlewares/errorHandler");

require("dotenv").config();
connectToDB();

const PORT = process.env.PORT;
const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));

mongoose.connection.once("open", () => {
  console.log("Connected to database");
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});

app.use(errorHandler);

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});

mongoose.connection.on("disconnected", () => {
  logEvents(`Disconnected From mongo`, "mongoErrLog.log");
});

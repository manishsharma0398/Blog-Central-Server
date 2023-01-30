const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { connectToDB } = require("./config/dbConnect");
const { logEvents } = require("./middlewares/logger");
const { errorHandler } = require("./middlewares/errorHandler");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const profileRoutes = require("./routes/profileRoutes");

require("dotenv").config();
connectToDB();

const PORT = process.env.PORT || 5001;
const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));

// routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/proflie", profileRoutes);

app.use(errorHandler);
mongoose.connection.once("open", () => {
  console.log("Connected to database");
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});

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

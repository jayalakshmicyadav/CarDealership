require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const logger = require("morgan");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const dbconnection = require("./Config/Dbconfiguration");

// Initialize database connection
dbconnection();

const app = express();
const server = http.Server(app);

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://car-dealership-frontend.vercel.app",
];

const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
});

// Security middleware
try {
  const helmet = require("helmet");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
} catch (e) {
  console.log("⚠️ helmet not installed, skipping");
}

try {
  const compression = require("compression");
  app.use(compression());
} catch (e) {
  console.log("⚠️ compression not installed, skipping");
}

try {
  const rateLimit = require("express-rate-limit");
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many requests, please try again later." },
    })
  );
} catch (e) {
  console.log("⚠️ express-rate-limit not installed, skipping");
}

// Middleware
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }));
app.use(logger("tiny"));
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

// Serve local uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/", require("./Routes/index"));
app.use("/admin", require("./Routes/admin"));
app.use("/car", require("./Routes/cars"));
app.use("/review", require("./Routes/review"));
app.use("/buyer", require("./Routes/buyer"));
app.use("/dealer", require("./Routes/dealer"));
app.use("/deal", require("./Routes/deal"));

// Error Handling
const ErrorHandler = require("./Utils/ErrorHandler");
const { generatedError } = require("./Middleware/error");
const { onConnect, socketMiddleware } = require("./Utils/Socket");

app.all("*", (req, res, next) => {
  next(new ErrorHandler(`Requested URL not found: ${req.url}`, 404));
});
app.use(generatedError);

// Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

// Socket.io
io.use(socketMiddleware);
io.on("connection", onConnect);

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const logger = require("morgan");
const http = require("http");
const socketIo = require("socket.io");

const dbconnection = require("./Config/Dbconfiguration");

// Initialize database connection
dbconnection();

const app = express();
const server = http.Server(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://car-dealership-frontend.vercel.app",
    ],
    credentials: true,
  },
});

// Middleware
app.use(fileUpload());
app.use(logger("tiny"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://car-dealership-frontend.vercel.app",
    ],
    credentials: true,
  })
);

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
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

// Socket.io
io.use(socketMiddleware);
io.on("connection", onConnect);

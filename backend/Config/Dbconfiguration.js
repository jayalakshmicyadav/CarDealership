const mongoose = require("mongoose");

const dbconnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected!");
  } catch (error) {
    console.log("Error connecting to DB:", error.message);
  }
};

module.exports = dbconnection;
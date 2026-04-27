const mongoose = require("mongoose");

const bargainSchema = new mongoose.Schema(
  {
    chat_id: { type: mongoose.Schema.Types.ObjectId },
    sender: { type: mongoose.Schema.Types.ObjectId },
    receiver: { type: mongoose.Schema.Types.ObjectId },
    car_id: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
    price: {
      price: { type: Number },
      status: { type: String, enum: ["Rejected", "Accepted", "Ongoing"] },
    },
  },
  {
    timestamp: true,
  }
);

const Bargain = mongoose.model("Bargain", bargainSchema);

module.exports = Bargain;

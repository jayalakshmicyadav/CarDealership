const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    chat_id: { type: mongoose.Schema.Types.ObjectId },
    sender: { type: mongoose.Schema.Types.ObjectId },
    receiver: { type: mongoose.Schema.Types.ObjectId },
    car_id: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
    message: { type: String },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

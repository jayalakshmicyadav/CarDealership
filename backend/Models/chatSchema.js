const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer" },
    chat_name_buyer: { type: String },
    dealer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer" },
    chat_name_dealer: { type: String },
    car_id: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
    last_message: { type: String },
    last_bargain: { price: { type: String }, status: { type: String } },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    bargain: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bargain" }],
    unread: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;

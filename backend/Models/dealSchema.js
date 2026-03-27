// dealModel.js
const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema({
  car_id: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
  buyer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buyer",
    required: true,
  },
  dealer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dealer",
    required: true,
  },
  price: { type: Number },
  order_id: { type: String },
  payment_id: { type: String },
});

const Deal = mongoose.model("Deal", dealSchema);

module.exports = Deal;

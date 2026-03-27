const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  car_id: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
  buyer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buyer",
    required: true,
  },
  rating: { type: Number, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Create a model
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;

const mongoose = require("mongoose");

// Define car schema
const carSchema = new mongoose.Schema(
  {
    image: {
      type: {
        main: { fileId: String, url: String },
        secondary: { fileId: String, url: String },
        tertiary: { fileId: String, url: String },
      },
    },
    type: { type: String, required: true },
    name: { type: String, required: true },
    model: { type: String, required: true },
    door: { type: Number },
    air_conditioner: { type: Boolean },
    fuel_capacity: { type: String },
    transmission: { type: String, enum: ["Manual", "Automatic"] },

    price: { type: Number },
    capacity: { type: Number },
    description: { type: String },
    sold: { type: Boolean, default: false },
    bargain: { type: Boolean, default: false },
    bargained: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer" },
        price: { type: Number, default: -1 },
      },
    ],
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      default: null,
    },
    review: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    rating: { type: Number, default: 0 },
    dealer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
    },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
  },
  {
    timestamps: true,
  }
);

// Create a model
const Car = mongoose.model("Car", carSchema);

module.exports = Car;

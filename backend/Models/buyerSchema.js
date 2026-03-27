const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define a secret key for salting passwords
const SALT_ROUNDS = 10; // You can adjust the number of rounds as needed
// Define user info schema

// Define the schema for buyer
const buyerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, selected: false },
  user_name: { type: String, required: true },
  phone: { type: Number },
  location: { type: String },
  deals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
  cars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
  watch_list: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
  review: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  chat: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
});

buyerSchema.pre("save", function () {
  if (!this.isModified("password")) {
    return;
  }

  let salt = bcrypt.genSaltSync(SALT_ROUNDS);
  this.password = bcrypt.hashSync(this.password, salt);
});

buyerSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// Create a model for the buyer schema
const Buyer = mongoose.model("Buyer", buyerSchema);

module.exports = Buyer;

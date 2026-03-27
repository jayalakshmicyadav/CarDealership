// dealershipModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const dealerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  user_name: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  location: { type: String },
  phone: { type: Number },
  cars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
  deals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
  chat: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
});

dealerSchema.pre("save", function () {
  if (!this.password) return;

  let salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
});

dealerSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const Dealer = mongoose.model("Dealer", dealerSchema);

module.exports = Dealer;

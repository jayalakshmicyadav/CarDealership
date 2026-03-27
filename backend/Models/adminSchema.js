// adminModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  user_name: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
});

adminSchema.pre("save", function () {
  if (!this.isModified("password")) return;

  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
});

adminSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;

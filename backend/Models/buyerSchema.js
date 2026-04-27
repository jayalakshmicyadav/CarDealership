const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const buyerSchema = new mongoose.Schema(
  {
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    user_name:{ type: String, required: true },
    phone:    { type: Number },
    location: { type: String },
    avatar:   { fileId: String, url: String },
    deals:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
    cars:      [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
    watch_list:[{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
    review:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    chat:      [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
  },
  { timestamps: true }
);

buyerSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

buyerSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const Buyer = mongoose.model("Buyer", buyerSchema);
module.exports = Buyer;

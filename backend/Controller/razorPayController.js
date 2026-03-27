const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const Razorpay = require("razorpay");
const Car = require("../Models/carSchema");
const crypto = require("crypto");

// ✅ SAFE INITIALIZATION
let razorpay;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.log("⚠️ Razorpay disabled (keys missing)");
}

// ✅ MAKE PAYMENT
exports.makePayment = catchAsyncErrors(async (req, res, next) => {
  if (!razorpay) {
    return res.status(500).json({
      message: "Payment service not configured",
    });
  }

  const { carId } = req.body;
  const car = await Car.findById(carId);

  const order = await razorpay.orders.create({
    amount: car.price,
    currency: "INR",
    receipt: car._id,
    partial_payment: false,
  });

  console.log({ order });
  res.status(200).json(order);
});

// ✅ PAYMENT VERIFICATION
exports.paymentVerification = catchAsyncErrors(async (req, res, next) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({
      message: "Payment verification not configured",
    });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  let body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature == razorpay_signature;

  if (isAuthentic) {
    return res.redirect(
      `http://localhost:5173/paymentSuccess?reference=${razorpay_payment_id}`
    );
  } else {
    return res.status(400).json({
      success: false,
    });
  }
});
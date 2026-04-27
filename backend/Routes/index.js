const express = require("express");
const router = express.Router();
const Index = require("../Controller/indexController");
const RazorPay = require("../Controller/razorPayController");
const { isBuyer } = require("../Utils/checkUserType");
const isAuthenticated = require("../Middleware/authMiddleware");

router.get("/", (req, res) => {
  res.send("Car-Dealership-Backend");
});

router.get("/current-user", Index.getCurrentUser);

router.post("/make-payment", RazorPay.makePayment);

router.post("/payment-verification", RazorPay.paymentVerification);

module.exports = router;

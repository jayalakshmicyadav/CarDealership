const express = require("express");
const {
  isBuyer,
  isAdminOrDealer,
  isAdminOrBuyer,
  isAdmin,
} = require("../Utils/checkUserType");
const isAuthenticated = require("../Middleware/authMiddleware");
const router = express.Router();
const Deal = require("../Controller/dealController");

router.post("/make-payment", isBuyer, isAuthenticated, Deal.makePayment);
router.post("/verify-payment", isBuyer, isAuthenticated, Deal.verifyPayment);
router.post("/buy-car/:id", isBuyer, isAuthenticated, Deal.buyCar);
router.get("/get", isAdmin, isAuthenticated, Deal.getAllDeals);
router.get("/get/:id", isAuthenticated, Deal.getDealById);
router.get(
  "/get-dealer/:id",
  isAdminOrDealer,
  isAuthenticated,
  Deal.getDealerDeals
);
router.get(
  "/get-buyer/:id",
  isAdminOrBuyer,
  isAuthenticated,
  Deal.getBuyerDeals
);

module.exports = router;

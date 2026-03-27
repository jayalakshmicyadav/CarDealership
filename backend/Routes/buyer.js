const express = require("express");
const Buyer = require("../Controller/buyerController");
const isAuthenticated = require("../Middleware/authMiddleware");
const { isBuyer, isAdmin, isAdminOrBuyer } = require("../Utils/checkUserType");

const router = express.Router();

router.post("/register", Buyer.createBuyer);
router.post("/sign-in", Buyer.signIn);
router.get("/get/:id", isAdminOrBuyer, isAuthenticated, Buyer.getBuyerById);
router.get("/get", isAdmin, isAuthenticated, Buyer.getAllBuyers);
router.put("/update/:id", isBuyer, isAuthenticated, Buyer.updateBuyerById);
router.get("/watch-list", isBuyer, isAuthenticated, Buyer.getWatchList);
router.put("/watch-list/:id", isBuyer, isAuthenticated, Buyer.addWatchList);
router.delete("/watch-list", isBuyer, isAuthenticated, Buyer.emptyWatchList);
router.delete(
  "/watch-list/:id",
  isBuyer,
  isAuthenticated,
  Buyer.deleteWatchList
);
router.delete("/delete/:id", isAdminOrBuyer, Buyer.deleteBuyerById);

module.exports = router;

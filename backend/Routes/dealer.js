const express = require("express");
const Dealer = require("../Controller/dealerController");
const isAuthenticated = require("../Middleware/authMiddleware");
const { isDealer, isAdmin, isAdminOrDealer } = require("../Utils/checkUserType");

const router = express.Router();

// Auth
router.post("/register", Dealer.createDealer);
router.post("/sign-in",  Dealer.signIn);

// Profile (authenticated dealer only)
router.put("/profile",         isDealer, isAuthenticated, Dealer.updateProfile);
router.put("/change-password", isDealer, isAuthenticated, Dealer.changePassword);
router.delete("/account",      isDealer, isAuthenticated, Dealer.deleteAccount);

// Admin / existing
router.get("/get/:id",    isAdminOrDealer, isAuthenticated, Dealer.getDealerById);
router.get("/get",        isAdmin,         isAuthenticated, Dealer.getAllDealers);
router.put("/update/:id", isDealer,        isAuthenticated, Dealer.updateDealerById);
router.delete("/delete/:id", isAdminOrDealer, isAuthenticated, Dealer.deleteDealerById);

module.exports = router;

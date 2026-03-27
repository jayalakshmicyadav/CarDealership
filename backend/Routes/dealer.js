const express = require("express");
const Dealer = require("../Controller/dealerController");
const isAuthenticated = require("../Middleware/authMiddleware");
const {
  isDealer,
  isAdmin,
  isAdminOrDealer,
} = require("../Utils/checkUserType");

const router = express.Router();

router.post("/register", Dealer.createDealer);
router.post("/sign-in", Dealer.signIn);
router.get("/get/:id", isAdminOrDealer, isAuthenticated, Dealer.getDealerById);
router.get("/get", isAdmin, isAuthenticated, Dealer.getAllDealers);
router.put("/update/:id", isDealer, isAuthenticated, Dealer.updateDealerById);
router.delete("/delete/:id", isAdminOrDealer, Dealer.deleteDealerById);

module.exports = router;

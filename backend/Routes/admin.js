const Admin = require("../Controller/adminController");
const express = require("express");
const isAuthenticated = require("../Middleware/authMiddleware");
const { isAdmin } = require("../Utils/checkUserType");
const router = express.Router();

router.post("/register", Admin.createAdmin);
router.post("/sign-in", Admin.signIn);

router.get("/protected", isAdmin, isAuthenticated, (req, res) => {
  newAccessToken = req.newAccessToken;
  delete req.newAccessToken;
  setTimeout(() => {
    res.json({
      message: "Here",
      newAccessToken,
    });
})});

module.exports = router;

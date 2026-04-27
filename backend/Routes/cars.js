const express = require("express");
const Car = require("../Controller/carController");
const {
  isDealer,
  isBuyer,
  isAdminOrDealer,
} = require("../Utils/checkUserType");
const isAuthenticated = require("../Middleware/authMiddleware");

const router = express.Router();

router.post("/create", isDealer, isAuthenticated, Car.createCar);
router.get("/get", Car.getAllCars);
router.get("/get/:id", Car.getCarByID);
router.get(
  "/get-dealer-cars/:id",
  isAdminOrDealer,
  isAuthenticated,
  Car.getDealerCars
);
router.put("/update/:id", isDealer, isAuthenticated, Car.updateCarByID);
router.put("/update-img/:id", isDealer, isAuthenticated, Car.updateCarImgByID);
router.delete("/delete/:id", isDealer, isAuthenticated, Car.deleteCarById);

module.exports = router;

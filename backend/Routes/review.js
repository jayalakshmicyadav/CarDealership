const express = require("express");
const { isBuyer } = require("../Utils/checkUserType");
const Review = require("../Controller/reviewController");
const isAuthenticated = require("../Middleware/authMiddleware");
const router = express.Router();

//Add Reviews
router.post("/add-review", isBuyer, isAuthenticated, Review.addReview);
//Get Car Reviews
router.get("/car-review/:carId", Review.getCarReviews);
//Get Buyer Reviews
router.get("/buyer-review/:buyerId", Review.getBuyerReviews);

router.delete('/delete/:reviewId', isBuyer, isAuthenticated, Review.deleteReview)

module.exports = router;

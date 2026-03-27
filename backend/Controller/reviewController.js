const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const Buyer = require("../Models/buyerSchema");
const Car = require("../Models/carSchema");
const Review = require("../Models/reviewSchema");
const ErrorHandler = require("../Utils/ErrorHandler");

//ADD REVIEW
exports.addReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, buyerId, carId } = req.body;

  const existingReview = await Review.findOne({
    $and: [{ buyer_id: buyerId }, { car_id: carId }],
  }).populate("buyer_id", "user_name");

  const car = await Car.findById(carId);

  if (existingReview) {
    console.log({ existingReview });
    // Update the existing review
    // const ratings = await Review.find({ car_id: carId }).select("rating");
    // let totalRating = ratings.reduce(
    //   (total, rating) => total + rating.rating,
    //   0
    // );
    // totalRating = totalRating - existingReview.rating + rating;

    // NEW LOGIC
    let carRating = car.rating * car.review.length;
    const newCarRating =
      (carRating - existingReview.rating + rating) / car.review.length;

    // console.log({
    //   ratings,
    //   totalRating,
    //   carRating: totalRating / car.review.length,
    // });
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save();

    car.rating = newCarRating;
    await car.save();

    //Adding Car Rating
    const updatedReview = {
      ...existingReview.toObject(),
      car_rating: car.rating,
    };

    console.log({ updatedReview });

    res.status(200).json({
      message: "Review updated successfully!",
      review: updatedReview,
    });
    return; // Exit the function after updating the review
  }

  if (!car) return next(new ErrorHandler("Car not found!", 404));

  const newReview = await Review.create({
    buyer_id: buyerId,
    car_id: carId,
    rating,
    comment,
  });

  // const ratings = await Review.find({ car_id: carId }).select("rating");
  // let totalRating = ratings.reduce((total, rating) => total + rating.rating, 0);

  // New logic
  let carRating = car.rating * (car.review.length || 1);

  if (!newReview) return next(new ErrorHandler("Cannot create review!", 500));

  await newReview.populate("buyer_id", "user_name");

  car.review.push(newReview._id);
  const newCarRating = (carRating + newReview.rating) / car.review.length;
  // car.rating = (totalRating / (car.review.length || 1)).toFixed(1);
  car.rating = newCarRating;

  //Adding car rating
  const updatedReview = {
    ...newReview.toObject(),
    car_rating: car.rating,
  };

  const buyer = await Buyer.findByIdAndUpdate(
    buyerId,
    { $push: { review: newReview._id } },
    { new: true } // This option returns the modified document
  );

  if (!buyer) return next(new ErrorHandler("Buyer not found!", 404));
  car.save();

  res
    .status(200)
    .json({ message: "Review created successfully!", review: updatedReview });
});

//GET CAR REVIEW
exports.getCarReviews = catchAsyncErrors(async (req, res, next) => {
  const reviews = await Review.find({ car_id: req.params.carId });

  res.status(200).json({ reviews });
});

//GET Buyer REVIEW
exports.getBuyerReviews = catchAsyncErrors(async (req, res, next) => {
  const reviews = await Review.find({ buyer_id: req.params.buyerId });

  res.status(200).json({ reviews });
});

//Delete Review
// exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
//   const { reviewId } = req.params;

//   const deletedReview = await Review.findByIdAndDelete(reviewId);

//   const buyer = await Buyer.findByIdAndUpdate(deletedReview.buyer_id, {$pull : {review : deletedReview._id}})
//   const car = await Car.findByIdAndUpdate(deletedReview.car_id, {$pull : {review : deletedReview._id}})

//   console.log({ deletedReview });
// });
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { reviewId } = req.params;

  // Find the review to be deleted
  const deletedReview = await Review.findByIdAndDelete(reviewId);

  // If review not found, return 404 Not Found error
  if (!deletedReview) {
    return next(new ErrorHandler("Review not found!", 404));
  }

  // Remove the review from the associated buyer
  await Buyer.findByIdAndUpdate(deletedReview.buyer_id, {
    $pull: { review: deletedReview._id },
  });

  // Remove the review from the associated car
  await Car.findByIdAndUpdate(deletedReview.car_id, {
    $pull: { review: deletedReview._id },
  });

  // Recalculate the car rating after removing the review
  const car = await Car.findById(deletedReview.car_id);
  if (!car) {
    return next(new ErrorHandler("Car not found!", 404));
  }

  // Fetch all remaining reviews for the car and calculate the new rating
  const remainingReviews = await Review.find({
    car_id: deletedReview.car_id,
  }).select("rating");
  const totalRating = remainingReviews.reduce(
    (total, review) => total + review.rating,
    0
  );
  car.rating = totalRating / (remainingReviews.length || 1);
  await car.save();

  const updatedReview = {
    ...deletedReview.toObject(),
    car_rating: car.rating,
  };

  // Respond with success message
  res
    .status(200)
    .json({ message: "Review deleted successfully", review: updatedReview });
});

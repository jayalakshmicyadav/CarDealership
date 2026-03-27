const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const Admin = require("../Models/adminSchema");
const Dealer = require("../Models/dealerSchema");
const Buyer = require("../Models/buyerSchema");
const ErrorHandler = require("../Utils/ErrorHandler");
const { getUserId } = require("../Utils/getUserId");
const { verifyAndDecodeUserType } = require("../Utils/verifyUserToken");

exports.getCurrentUser = catchAsyncErrors(async (req, res, next) => {
  getUserId(req, next);

  // console.log(req.userId, req.newAccessToken);
  const { userId, newAccessToken } = req;
  delete req.userId;
  delete req.newAccessToken;

  if (!userId) {
    return next(new ErrorHandler("No Id found", 500));
  }

  const userType =
    verifyAndDecodeUserType(req.header("User-Type"), next) || null;

  console.log(userType);

  let user = null;

  if (userType == "Admin") {
    user = await Admin.findById(userId);
  } else if (userType == "Dealer") {
    user = await Dealer.findById(userId).populate({
      path: "chat",
      options: { sort: { updatedAt: -1 } }, // Sort chat by updatedAt
      populate: [
        {
          path: "messages",
          options: { sort: { createdAt: 1 } }, // Sort messages by createdAt
        },
        {
          path: "car_id",
          select: "image.main.url buyer_id", // Select only the image.main.url property
        },
        {
          path: "bargain",
          options: { sort: { createdAt: 1 } }, // Sort messages by createdAt
        },
      ],
    });
  } else if (userType == "Buyer") {
    user = await Buyer.findById(userId).populate({
      path: "chat",
      options: { sort: { updatedAt: -1 } }, // Sort chat by updatedAt
      populate: [
        {
          path: "messages",
          options: { sort: { createdAt: 1 } }, // Sort messages by createdAt
        },
        {
          path: "car_id",
          select: "image.main.url buyer_id", // Select only the image.main.url property
        },
        {
          path: "bargain",
          options: { sort: { createdAt: 1 } }, // Sort messages by createdAt
        },
      ],
    });
  }

  if (!user)
    return res.status(404).json({
      message: "User not found!",
    });

  res.status(200).json({
    userType,
    user,
    newAccessToken,
  });
});

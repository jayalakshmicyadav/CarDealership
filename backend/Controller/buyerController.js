const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const ErrorHandler = require("../Utils/ErrorHandler");
const { body, validationResult } = require("express-validator");
const Buyer = require("../Models/buyerSchema");
const {
  generateAccessToken,
  generateRefreshToken,
  generateUserTypeToken,
} = require("../Utils/tokenUtilityFunctions");
const { removePassword } = require("../Utils/removePassword");

const validateInput = [
  body("email")
    .notEmpty()
    .withMessage("Email is required to register buyer")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("user_name")
    .notEmpty()
    .withMessage("UserName is required to register buyer")
    .isLength({ min: 4 })
    .withMessage("UserName must be at least 4 characters long"),
  body("password")
    .notEmpty()
    .withMessage("Password is required to register buyer")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// CREATE BUYER
exports.createBuyer = [
  ...validateInput,
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((error) => error.msg)
        .join(", ");
      return next(new ErrorHandler(errorMessages, 400));
    }

    // Check if the email is already registered
    let buyer = await Buyer.findOne({ email: req.body.email });
    if (buyer) {
      return next(new ErrorHandler("Email already registered", 401));
    }
    buyer = await Buyer.findOne({ user_name: req.body.user_name });
    if (buyer) {
      return next(new ErrorHandler("Username already registered", 401));
    }

    // Create a new buyer
    const newBuyer = new Buyer(req.body);

    const accessToken = generateAccessToken(newBuyer._id);
    const refreshToken = generateRefreshToken(newBuyer._id);

    const userType = generateUserTypeToken("Buyer");

    // Save the new buyer to the database
    await newBuyer.save();

    return res.status(200).json({
      message: "Buyer created successfully",
      newBuyer,
      accessToken,
      refreshToken,
      userType,
    });
  }),
];

//SIGN IN
exports.signIn = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  if (!password) {
    return next(new ErrorHandler("Password is required", 400));
  }

  const buyer = await Buyer.findOne({
    email: email,
  })
    .select("+password")
    .populate({
      path: "chat",
      options: { sort: { updatedAt: -1 } }, // Sort chat by updatedAt
      populate: [
        {
          path: "messages",
          options: { sort: { createdAt: 1 } }, // Sort messages by createdAt
        },
        {
          path: "car_id",
          select: "image.main.url", // Select only the image.main.url property
        },
        {
          path: "bargain",
          options: { sort: { createdAt: 1 } }, // Sort messages by createdAt
        },
      ],
    });

  if (!buyer) return next(new ErrorHandler("Email not registered", 401));

  if (!buyer.comparePassword(password))
    return next(new ErrorHandler("Incorrect password", 401));

  const accessToken = generateAccessToken(buyer._id);
  const refreshToken = generateRefreshToken(buyer._id);

  const userType = generateUserTypeToken("Buyer");

  const buyerWithoutPassword = removePassword(buyer.toObject());

  return res.status(200).json({
    message: "Buyer signed-in successfully",
    buyer: buyerWithoutPassword,
    accessToken,
    refreshToken,
    userType,
  });
});

// GET BUYER BY ID
exports.getBuyerById = catchAsyncErrors(async (req, res, next) => {
  const buyerId = req.params.id;

  const buyer = await Buyer.findById(buyerId);
  if (!buyer) {
    return next(new ErrorHandler("Buyer not found", 404));
  }

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({
    buyer,
    newAccessToken,
  });
});

//GET ALL BUYER
exports.getAllBuyers = catchAsyncErrors(async (req, res, next) => {
  const buyers = await Buyer.find();

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({ buyers, newAccessToken });
});

// UPDATE BUYER BY ID
exports.updateBuyerById = catchAsyncErrors(async (req, res, next) => {
  const buyerId = req.params.id;

  const { email, user_name, phone, location } = req.body;

  // Check if the buyer exists
  const existingBuyer = await Buyer.findById(buyerId);
  if (!existingBuyer) {
    return next(new ErrorHandler("Buyer not found", 404));
  }

  // Update only the fields that are provided in the request body
  if (email !== undefined) {
    existingBuyer.email = email;
  }
  if (user_name !== undefined) {
    existingBuyer.user_name = user_name;
  }
  if (phone !== undefined) {
    existingBuyer.phone = phone;
  }
  if (location !== undefined) {
    existingBuyer.location = location;
  }

  // Save the updated buyer to the database
  const updatedBuyer = await existingBuyer.save();

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({
    message: "Buyer updated successfully",
    updatedBuyer,
    newAccessToken,
  });
});

// DELETE BUYER BY ID
exports.deleteBuyerById = catchAsyncErrors(async (req, res, next) => {
  const buyerId = req.params.id;

  const deletedBuyer = await Buyer.findByIdAndDelete(buyerId);
  if (!deletedBuyer) {
    return next(new ErrorHandler("Buyer not found", 404));
  }

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  return res.status(200).json({
    message: "Buyer deleted successfully",
    newAccessToken,
  });
});

//GET WATCH-LIST
exports.getWatchList = catchAsyncErrors(async (req, res, next) => {
  const buyer = await Buyer.findById(req.userId).populate("watch_list");

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({ watchList: buyer.watch_list, newAccessToken });
});

//ADD TO WATCH-LIST
exports.addWatchList = catchAsyncErrors(async (req, res, next) => {
  const buyer = await Buyer.findById(req.userId);
  if (!buyer) return next(new ErrorHandler("No Buyer found with the id", 404));

  if (buyer.watch_list.includes(req.params.id)) {
    // Item already exists in watch list
    return res.status(400).json({
      message: "Item already exists in watch list",
      watchList: buyer.watch_list,
    });
  }

  const updatedBuyer = await Buyer.findByIdAndUpdate(
    req.userId,
    { $addToSet: { watch_list: req.params.id } },
    { new: true }
  );

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({
    message: "Added to watch list",
    watchList: updatedBuyer.watch_list,
    newAccessToken,
  });
});

//DELETE WATCH-LIST BY ID
exports.deleteWatchList = catchAsyncErrors(async (req, res, next) => {
  const updatedBuyer = await Buyer.findByIdAndUpdate(
    req.userId,
    { $pull: { watch_list: req.params.id } },
    { new: true }
  );

  if (!updatedBuyer)
    return next(new ErrorHandler("No buyer found with id", 404));

  let newAccessToken = req.newAccessToken;
  delete newAccessToken;

  res.status(200).json({
    message: "Watch List updated successfully",
    watchList: updatedBuyer.watch_list,
    newAccessToken,
  });
});

//EMPTY WATCH-LIST
exports.emptyWatchList = catchAsyncErrors(async (req, res, next) => {
  const result = await Buyer.updateOne(
    { _id: req.userId },
    { $set: { watch_list: [] } }
  );

  if (!result.modifiedCount) {
    return next(new ErrorHandler("Nothing removed from the watchList", 404));
  }

  let newAccessToken = req.newAccessToken;
  delete newAccessToken;

  res.status(200).json({
    message: "Watch List emptied successfully",
    newAccessToken,
  });
});

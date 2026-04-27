const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const ErrorHandler = require("../Utils/ErrorHandler");
const { body, validationResult } = require("express-validator");
const Dealer = require("../Models/dealerSchema");
const Car = require("../Models/carSchema");
const { saveLocalImage, deleteLocalImage } = require("../Utils/fileStorage");
let imageKit = require("../Utils/imageKit").initImageKit();
const {
  generateAccessToken,
  generateRefreshToken,
  generateUserTypeToken,
} = require("../Utils/tokenUtilityFunctions");
const { removePassword } = require("../Utils/removePassword");

const validateInput = [
  body("email")
    .notEmpty()
    .withMessage("Email is required to register dealer")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("user_name")
    .notEmpty()
    .withMessage("UserName is required to register dealer")
    .isLength({ min: 4 })
    .withMessage("UserName must be at least 4 characters long"),
  body("password")
    .notEmpty()
    .withMessage("Password is required to register dealer")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// CREATE DEALER
exports.createDealer = [
  ...validateInput,
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.errors[0].msg);
      // const errorMessages = errors
      //   .array()
      //   .map((error) => error.msg)
      //   .join(", ");
      return next(new ErrorHandler(errors.errors[0].msg, 400));
    }

    // Check if the email is already registered
    let dealer = await Dealer.findOne({ email: req.body.email });
    if (dealer) {
      return next(new ErrorHandler("Email already registered", 401));
    }
    dealer = await Dealer.findOne({
      user_name: req.body.user_name.toLowerCase(),
    });
    if (dealer) {
      return next(new ErrorHandler("Username already registered", 401));
    }

    // Create a new dealer
    const newDealer = await Dealer.create({
      email: req.body.email,
      password: req.body.password,
      user_name: req.body.user_name.toLowerCase(),
    });
    const dealerWithoutPassword = removePassword(newDealer.toObject());

    const accessToken = generateAccessToken(newDealer._id);
    const refreshToken = generateRefreshToken(newDealer._id);

    const userType = generateUserTypeToken("Dealer");

    return res.status(200).json({
      message: "Dealer created successfully",
      newDealer: dealerWithoutPassword,
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

  const dealer = await Dealer.findOne({ email: email })
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
  console.log({ dealer, email });

  if (!dealer) return next(new ErrorHandler("Email not registered", 401));

  if (!dealer.comparePassword(password))
    return next(new ErrorHandler("Incorrect password", 401));

  const accessToken = generateAccessToken(dealer._id);
  const refreshToken = generateRefreshToken(dealer._id);

  const userType = generateUserTypeToken("Dealer");

  const dealerWithoutPassword = removePassword(dealer.toObject());

  return res.status(200).json({
    message: "Dealer signed-in successfully",
    dealer: dealerWithoutPassword,
    accessToken,
    refreshToken,
    userType,
  });
});

// GET DEALER BY ID
exports.getDealerById = catchAsyncErrors(async (req, res, next) => {
  const dealerId = req.params.id;

  const dealer = await Dealer.findById(dealerId);
  if (!dealer) {
    return next(new ErrorHandler("Dealer not found", 404));
  }

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({
    dealer,
    newAccessToken,
  });
});

//GET ALL DEALER
exports.getAllDealers = catchAsyncErrors(async (req, res, next) => {
  const dealers = await Dealer.find();

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({ dealers, newAccessToken });
});

// UPDATE DEALER BY ID
exports.updateDealerById = catchAsyncErrors(async (req, res, next) => {
  const dealerId = req.params.id;

  const { email, user_name, phone, location } = req.body;

  // Check if the dealer exists
  const existingDealer = await Dealer.findById(dealerId);
  if (!existingDealer) {
    return next(new ErrorHandler("Dealer not found", 404));
  }

  // Update only the fields that are provided in the request body
  if (email !== undefined) {
    existingDealer.email = email;
  }
  if (user_name !== undefined) {
    existingDealer.user_name = user_name;
  }
  if (phone !== undefined) {
    existingDealer.phone = phone;
  }
  if (location !== undefined) {
    existingDealer.location = location;
  }

  // Save the updated dealer to the database
  const updatedDealer = await existingDealer.save();
  const dealerWithoutPassword = removePassword(updatedDealer.toObject());

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({
    message: "Dealer updated successfully",
    updatedDealer: dealerWithoutPassword,
    newAccessToken,
  });
});

// DELETE DEALER BY ID
exports.deleteDealerById = catchAsyncErrors(async (req, res, next) => {
  const dealerId = req.params.id;

  const deletedDealer = await Dealer.findByIdAndDelete(dealerId);
  if (!deletedDealer) {
    return next(new ErrorHandler("Dealer not found", 404));
  }

  const deletedCars = await Car.deleteMany({ dealer_id: dealerId });

  let newAccessToken = req.newAccessToken;
  delete newAccessToken;

  return res.status(200).json({
    message: "Dealer deleted successfully",
    deletedCars,
    newAccessToken,
  });
});

// UPDATE OWN PROFILE
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const dealer = await Dealer.findById(req.userId);
  if (!dealer) return next(new ErrorHandler("Dealer not found", 404));

  const { user_name, email, phone, location } = req.body;
  if (user_name !== undefined) dealer.user_name = user_name;
  if (email !== undefined) {
    const exists = await Dealer.findOne({ email, _id: { $ne: req.userId } });
    if (exists) return next(new ErrorHandler("Email already in use", 400));
    dealer.email = email;
  }
  if (phone !== undefined) dealer.phone = phone;
  if (location !== undefined) dealer.location = location;

  if (req.files?.avatar) {
    if (dealer.avatar?.fileId) deleteLocalImage(dealer.avatar.fileId);
    dealer.avatar = await saveLocalImage(req.files.avatar, "avatar-dealer");
  }

  await dealer.save();
  const newAccessToken = req.newAccessToken;
  delete req.newAccessToken;
  res.status(200).json({ message: "Profile updated", user: removePassword(dealer.toObject()), newAccessToken });
});

// CHANGE PASSWORD
exports.changePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return next(new ErrorHandler("Both current and new password are required", 400));
  if (newPassword.length < 6)
    return next(new ErrorHandler("New password must be at least 6 characters", 400));

  const dealer = await Dealer.findById(req.userId).select("+password");
  if (!dealer) return next(new ErrorHandler("Dealer not found", 404));
  if (!dealer.comparePassword(currentPassword))
    return next(new ErrorHandler("Current password is incorrect", 401));

  dealer.password = newPassword;
  await dealer.save();

  const newAccessToken = req.newAccessToken;
  delete req.newAccessToken;
  res.status(200).json({ message: "Password changed successfully", newAccessToken });
});

// DELETE OWN ACCOUNT
exports.deleteAccount = catchAsyncErrors(async (req, res, next) => {
  const dealer = await Dealer.findById(req.userId);
  if (!dealer) return next(new ErrorHandler("Dealer not found", 404));

  if (dealer.avatar?.fileId) deleteLocalImage(dealer.avatar.fileId);
  // Also delete all cars belonging to this dealer
  const dealerCars = await Car.find({ dealer_id: req.userId });
  for (const car of dealerCars) {
    if (car.image) {
      deleteLocalImage(car.image.main?.fileId);
      deleteLocalImage(car.image.secondary?.fileId);
      deleteLocalImage(car.image.tertiary?.fileId);
    }
    await Car.findByIdAndDelete(car._id);
  }
  await Dealer.findByIdAndDelete(req.userId);

  res.status(200).json({ message: "Account deleted successfully" });
});

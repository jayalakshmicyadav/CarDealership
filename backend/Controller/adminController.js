const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const ErrorHandler = require("../Utils/ErrorHandler");
const { body, validationResult } = require("express-validator");
const Admin = require("../Models/adminSchema");
const {
  generateAccessToken,
  generateRefreshToken,
  generateUserTypeToken,
} = require("../Utils/tokenUtilityFunctions");
const { removePassword } = require("../Utils/removePassword");

const validateInput = [
  body("email")
    .notEmpty()
    .withMessage("Email is required to register admin")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("user_name")
    .notEmpty()
    .withMessage("UserName is required to register admin")
    .isLength({ min: 4 })
    .withMessage("UserName must be at least 4 characters long"),
  body("password")
    .notEmpty()
    .withMessage("Password is required to register admin")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

//CREATE ADMIN
exports.createAdmin = [
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

    const { email, user_name, password } = req.body;

    let admin = await Admin.findOne({ email: email });
    if (admin) return next(new ErrorHandler("Email already registered", 401));

    admin = await Admin.findOne({ user_name });
    if (admin)
      return next(new ErrorHandler("Username already registered", 401));

    const newAdmin = await Admin.create({
      email,
      user_name,
      password,
    });
    const adminWithoutPassword = removePassword(newAdmin.toObject());

    const accessToken = generateAccessToken(newAdmin._id);
    const refreshToken = generateRefreshToken(newAdmin._id);

    const userType = generateUserTypeToken("Admin");

    return res.status(200).json({
      message: "Admin created successfully",
      newAdmin: adminWithoutPassword,
      accessToken,
      refreshToken,
      userType,
    });
  }),
];

//SIGN IN
exports.signIn = catchAsyncErrors(async (req, res, next) => {
  const { email, user_name, password } = req.body;

  if (!email && !user_name) {
    return next(new ErrorHandler("Email or Username is required", 400));
  }

  if (!password) {
    return next(new ErrorHandler("Password is required", 400));
  }

  const admin = await Admin.findOne({
    $or: [{ email: email }, { user_name: user_name }],
  }).select("+password");
  // console.log(admin);

  if (!admin)
    return next(new ErrorHandler("Email or Username not registered", 401));

  if (!admin.comparePassword(password))
    return next(new ErrorHandler("Incorrect password", 401));

  const accessToken = generateAccessToken(admin?._id);
  const refreshToken = generateRefreshToken(admin?._id);

  const adminWithoutPassword = removePassword(admin.toObject());

  const userType = generateUserTypeToken("Admin");

  return res.status(200).json({
    message: "Admin signed-in successfully",
    admin: adminWithoutPassword,
    accessToken,
    refreshToken,
    userType,
  });
});

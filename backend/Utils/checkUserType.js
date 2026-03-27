const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const ErrorHandler = require("./ErrorHandler");
const { verifyAndDecodeUserType } = require("./verifyUserToken");

// const verifyAndDecodeUserType = (userType, next) => {
//   try {
//     jwt.verify(userType, process.env.USER_TYPE_TOKEN_SECRET);
//     return jwt.decode(userType).userType;
//   } catch (err) {
//     console.error(err);
//     return next(new ErrorHandler(err.name, err.statusCode));
//   }
// };

exports.isAdmin = catchAsyncErrors((req, res, next) => {
  const userType = verifyAndDecodeUserType(req.header("User-Type"), next);
  if (userType && userType === "Admin") {
    next();
  } else {
    return next(
      new ErrorHandler("Only Admin is allowed to access this route"),
      403
    );
  }
});

exports.isDealer = catchAsyncErrors((req, res, next) => {
  const userType = verifyAndDecodeUserType(req.header("User-Type"), next);
  if (userType && userType === "Dealer") {
    next();
  } else {
    return next(
      new ErrorHandler("Only Dealer is allowed to access this route"),
      403
    );
  }
});

exports.isBuyer = catchAsyncErrors((req, res, next) => {
  const userType = verifyAndDecodeUserType(req.header("User-Type"), next);
  if (userType && userType === "Buyer") {
    next();
  } else {
    return next(
      new ErrorHandler("Only Buyer is allowed to access this route"),
      403
    );
  }
});

exports.isAdminOrDealer = catchAsyncErrors((req, res, next) => {
  const userType = verifyAndDecodeUserType(req.header("User-Type"), next);
  if ((userType && userType === "Dealer") || userType === "Admin") {
    next();
  } else {
    return next(
      new ErrorHandler("Only Dealer or Admin is allowed to access this route"),
      403
    );
  }
});

exports.isBuyerOrDealer = catchAsyncErrors((req, res, next) => {
  const userType = verifyAndDecodeUserType(req.header("User-Type"), next);
  if (userType && (userType === "Buyer" || userType === "Dealer")) {
    next();
  } else {
    return next(
      new ErrorHandler("Only Buyer or Dealer is allowed to access this route"),
      403
    );
  }
});

exports.isAdminOrBuyer = catchAsyncErrors((req, res, next) => {
  const userType = verifyAndDecodeUserType(req.header("User-Type"), next);
  if (userType && (userType === "Admin" || userType === "Buyer")) {
    next();
  } else {
    return next(
      new ErrorHandler("Only Admin or Buyer is allowed to access this route"),
      403
    );
  }
});

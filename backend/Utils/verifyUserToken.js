const jwt = require("jsonwebtoken");
const ErrorHandler = require("./ErrorHandler");

exports.verifyAndDecodeUserType = (userType, next) => {
  try {
    jwt.verify(userType, process.env.USER_TYPE_TOKEN_SECRET);
    return jwt.decode(userType).userType;
  } catch (err) {
    console.error(err);
    return next(new ErrorHandler(err.name, err.statusCode));
  }
};

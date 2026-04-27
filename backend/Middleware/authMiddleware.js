const jwt = require("jsonwebtoken");
// const User = require('../Models/userSchema');
const {
  verifyAndRefreshAccessToken,
} = require("../Utils/tokenUtilityFunctions");
const ErrorHandler = require("../Utils/ErrorHandler");

const isAuthenticated = async (req, res, next) => {
  try {
    // Extract the access token and refresh token from the request headers
    const accessToken = req.header("Authorization")?.replace("Bearer ", "");
    const refreshToken = req.header("Refresh-Token");

    if (!accessToken && !refreshToken) {
      return next(new ErrorHandler("Access denied. Tokens are missing.", 401));
      // res.status(401).json({ message:  });
    }

    // Verify and possibly refresh the access token
    const newAccessToken = verifyAndRefreshAccessToken(
      accessToken,
      refreshToken,
      next
    );

    // Attach the user ID from the access token to the request object
    const decodedToken = jwt.decode(newAccessToken);
    req.userId = decodedToken && decodedToken.userId;
    // console.log(newAccessToken == accessToken);
    req.newAccessToken = newAccessToken == accessToken ? null : newAccessToken;

    // Call the next middleware
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return new ErrorHandler("Internal server error", 500);
  }
};

module.exports = isAuthenticated;

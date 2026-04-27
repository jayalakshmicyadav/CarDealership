const jwt = require("jsonwebtoken");
const ErrorHandler = require("./ErrorHandler");

// Function to generate access token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

// Function to generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "3d",
  });
};

const generateUserTypeToken = (userType) => {
  return jwt.sign({ userType }, process.env.USER_TYPE_TOKEN_SECRET, {
    expiresIn: "3d",
  });
};

// Function to verify and refresh access token if expired
const verifyAndRefreshAccessToken = (accessToken, refreshToken, next) => {
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    return accessToken; // Access token is valid, no need to refresh
  } catch (accessTokenError) {
    if (accessTokenError.name !== "TokenExpiredError") {
      return next(new ErrorHandler(accessTokenError.name, 500)); // Other token errors
    }

    try {
      // Access token is expired, try to verify the refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      // Generate a new access token and return it
      const newAccessToken = generateAccessToken(decoded.userId);
      return newAccessToken;
    } catch (refreshTokenError) {
      // console.log(refreshTokenError);
      return next(
        new ErrorHandler(
          refreshTokenError.name,
          refreshTokenError.name == "TokenExpiredError" ? 401 : 500
        )
      );
      // Refresh token verification failed
    }
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateUserTypeToken,
  verifyAndRefreshAccessToken,
};

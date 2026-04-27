const jwt = require("jsonwebtoken");
const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const { verifyAndRefreshAccessToken } = require("./tokenUtilityFunctions");

exports.getUserId = catchAsyncErrors((req, next) => {
  const accessToken = req.header("Authorization")?.replace("Bearer ", "");
  const refreshToken = req.header("Refresh-Token");

  const newAccessToken = verifyAndRefreshAccessToken(
    accessToken,
    refreshToken,
    next
  );

  const decodedToken = jwt.decode(newAccessToken);
  const userId = decodedToken.userId || null;

//   console.log({ newAccessToken, decodedToken, userId });

  //   let newAccessToken = newAccessToken == accessToken ? null : newAccessToken;

  req.userId = userId;
  req.newAccessToken = newAccessToken == accessToken ? null : newAccessToken;;
});

import { catchAsyncError } from "../../utils/CatchErrors";
import axiosInstance from "../../utils/Axios";
import { setAccessToken, setTokens } from "../../utils/Token";
import { addUser, removeUser, updateUser } from "../reducers/appReducer";

// ----------------------------Current-User------------------------------
export const asyncCurrentUser = catchAsyncError(() => async (dispatch) => {
  const res = await axiosInstance.get("/current-user");
  console.log(res);
  if (res.status == 200) {
    if (res.data.newAccessToken) {
      setAccessToken(res.data.newAccessToken);
    }
    dispatch(addUser({ userType: res.data.userType, user: res.data.user }));
  }
  let userType = res.data.userType || null;
  return { userType, status: res.status };
});

// ------------------------AUTHENTICATION---------------------------------
// -----------------------------Dealer------------------------------------
export const asyncDealerSignUp = catchAsyncError(
  (dealer) => async (dispatch) => {
    const res = await axiosInstance.post("/dealer/register", dealer);
    setTokens(res.data.accessToken, res.data.refreshToken, res.data.userType);
    dispatch(addUser({ userType: "Dealer", user: res.data.newDealer }));
    return res.status;
  }
);

export const asyncDealerSignIn = catchAsyncError(
  (dealer) => async (dispatch) => {
    const res = await axiosInstance.post("/dealer/sign-in", dealer);

    setTokens(res.data.accessToken, res.data.refreshToken, res.data.userType);
    dispatch(addUser({ userType: "Dealer", user: res.data.dealer }));

    return res.status;
  }
);

// -----------------------------Buyer------------------------------------
export const asyncBuyerSignIn = catchAsyncError((buyer) => async (dispatch) => {
  const res = await axiosInstance.post("/buyer/sign-in", buyer);
  setTokens(res.data.accessToken, res.data.refreshToken, res.data.userType);
  dispatch(addUser({ userType: "Buyer", user: res.data.buyer }));
  return res.status;
});

export const asyncBuyerSignUp = catchAsyncError((buyer) => async (dispatch) => {
  const res = await axiosInstance.post("/buyer/register", buyer);
  setTokens(res.data.accessToken, res.data.refreshToken, res.data.userType);
  dispatch(addUser({ userType: "Buyer", user: res.data.newBuyer }));
  return res.status;
});

// ----------------------------Log-out------------------------------
export const asyncLogOut = () => (dispatch) => {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userType");

    dispatch(removeUser());
    return 200;
  } catch (err) {
    console.log(err);
  }
};

// ----------------------------Update Profile-------------------------------
export const asyncUpdateProfile = catchAsyncError(
  (formData, userType) => async (dispatch) => {
    const url = userType === "Dealer" ? "/dealer/profile" : "/buyer/profile";
    const res = await axiosInstance.put(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data.newAccessToken) setAccessToken(res.data.newAccessToken);
    dispatch(updateUser(res.data.user));
    return res.status;
  }
);

// ----------------------------Change Password-------------------------------
export const asyncChangePassword = catchAsyncError(
  (data, userType) => async () => {
    const url = userType === "Dealer" ? "/dealer/change-password" : "/buyer/change-password";
    const res = await axiosInstance.put(url, data);
    if (res.data.newAccessToken) setAccessToken(res.data.newAccessToken);
    return res.status;
  }
);

// ----------------------------Delete Account--------------------------------
export const asyncDeleteAccount = catchAsyncError(
  (userType) => async (dispatch) => {
    const url = userType === "Dealer" ? "/dealer/account" : "/buyer/account";
    const res = await axiosInstance.delete(url);
    if (res.status === 200) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userType");
      dispatch(removeUser());
    }
    return res.status;
  }
);

// -----------------------------OTHER ASYNC FUNCTIONS------------------------------------

// -----------------------------Dealer----------------------------------------

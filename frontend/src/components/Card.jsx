import Car_img from "/assets/image/car_img1.png";
import User_icon from "/assets/icon/user_icon.svg";
import Type_icon from "/assets/icon/type_icon.svg";
import Conditioner_icon from "/assets/icon/conditioner_icon.svg";
import Door_icon from "/assets/icon/door_icon.svg";
import { Heart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateSelectedCar } from "../store/reducers/appReducer";
import { useNavigate } from "react-router-dom";
import {
  asyncAddWatchList,
  asyncDeleteWatchList,
} from "../store/actions/carActions";
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from "../utils/Toast";
import { useEffect, useState } from "react";

const Card = ({ car, buy = true }) => {
  const { isAuthenticated, userType, watchList } = useSelector((state) => state.app);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { allCars, user } = useSelector((state) => state.app);
  const [myCars, setMyCars] = useState([]);

  useEffect(() => {
    const cars = (allCars || [])
      .filter((c) => c.sold && user?._id == c?.buyer_id)
      .map((c) => c._id);
    setMyCars(cars);
  }, [allCars, user]);

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      notifyInfo("Login to perform actions!");
      return navigate("/sign-in");
    }
    dispatch(updateSelectedCar(car));
    navigate("/payment");
  };

  const inWatchList = watchList?.includes(car._id);
  const isOwned = myCars.includes(car._id);

  return (
    <div
      className="border border-gray-200 bg-white p-4 rounded-2xl relative hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
      onClick={() => {
        dispatch(updateSelectedCar(car));
        userType === "Dealer" ? navigate("/dealer/car-detail") : navigate("/car-detail");
      }}
    >
      {/* Watchlist heart — only for non-dealer, non-owned cars */}
      {userType !== "Dealer" && !isOwned && (
        <button
          type="button"
          aria-label={inWatchList ? "Remove from watchlist" : "Add to watchlist"}
          onClick={(e) => {
            e.stopPropagation();
            if (!isAuthenticated) {
              notifyInfo("Login to perform actions!");
              return navigate("/sign-in");
            }
            if (inWatchList) {
              dispatch(asyncDeleteWatchList(car._id)).then((res) => {
                res === 200 ? notifySuccess("Removed from watchlist!") : notifyError("Error removing from watchlist");
              });
            } else {
              dispatch(asyncAddWatchList(car._id)).then((res) => {
                res === 200 ? notifySuccess("Added to watchlist!") : notifyError("Error adding to watchlist");
              });
            }
          }}
          className="absolute z-10 top-3 right-3 bg-white shadow-md p-2 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <Heart
            size={16}
            className={inWatchList ? "text-red-400" : "text-gray-400"}
            fill={inWatchList ? "#FCA5A5" : "white"}
          />
        </button>
      )}

      {/* Car image */}
      <div className="relative overflow-hidden rounded-xl mb-3">
        <div className="w-full h-44 bg-gray-50 rounded-xl overflow-hidden">
          <img
            src={typeof car?.image === "string" ? car.image : car?.image?.main?.url || Car_img}
            alt={`${car?.name} ${car?.model}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Status ribbon — logic:
            Sold + I bought it  → "Bought"  (green, buyer only)
            Sold + someone else → "Sold"    (red)
            Not sold + dealer   → "For Sale" (green, dealer view only)
            Not sold + buyer    → nothing (sold cars are already filtered on browse pages) */}
        {car?.sold ? (
          userType === "Buyer" && user?._id === car?.buyer_id ? (
            <div className="absolute top-3 left-[-28px] bg-green-500 z-20 px-9 py-0.5 -rotate-45 font-semibold text-xs text-white shadow-sm">
              Bought
            </div>
          ) : (
            <div className="absolute top-3 left-[-28px] bg-red-500 z-20 px-9 py-0.5 -rotate-45 font-semibold text-xs text-white shadow-sm">
              Sold
            </div>
          )
        ) : userType === "Dealer" ? (
          <div className="absolute top-3 left-[-28px] bg-green-500 z-20 px-9 py-0.5 -rotate-45 font-semibold text-xs text-white shadow-sm">
            For Sale
          </div>
        ) : null}
      </div>

      {/* Car name & rating */}
      <h2 className="text-base font-semibold text-gray-900 truncate">
        {car?.name} {car?.model}
      </h2>
      <p className="text-sm font-medium mt-0.5 text-gray-600">
        ⭐ {car?.rating ?? 0}{" "}
        <span className="text-gray-400 font-normal">
          ({car?.review?.length ?? 0} reviews)
        </span>
      </p>

      {/* Car specs */}
      <div className="grid grid-cols-2 gap-x-4 mt-3 pb-3 border-b border-gray-100">
        {[
          { icon: User_icon, content: `${car?.capacity ?? "–"} Passengers` },
          { icon: Type_icon, content: car?.transmission || "NA" },
          { icon: Conditioner_icon, content: car?.air_conditioner ? "AC" : "Non-AC" },
          { icon: Door_icon, content: `${car?.door ?? 0} Doors` },
        ].map((info, index) => (
          <div key={index} className="flex items-center gap-1.5 mt-2">
            <img src={info.icon} alt="" className="w-4 h-4 shrink-0" />
            <span className="text-xs text-gray-500 truncate">{info.content}</span>
          </div>
        ))}
      </div>

      {/* Price & buy button */}
      <div className="flex items-center justify-between mt-3">
        <div>
          <span className="text-xs text-gray-400">Price</span>
          <p className="text-base font-bold text-gray-900">
            ₹ {car?.price?.toLocaleString("en-IN") ?? "N/A"}
          </p>
        </div>

        {userType !== "Dealer" && buy && !car?.sold && (
          <button
            type="button"
            onClick={handleBuyNow}
            className="bg-[#1572D3] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
          >
            Buy Now
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;

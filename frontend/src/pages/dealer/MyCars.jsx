import { Trash, Pencil, LoaderCircle } from "lucide-react";
import Car_img from "/assets/image/car_img1.png";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { notifyError } from "../../utils/Toast";
import { asyncGetDealerCars } from "../../store/actions/carActions";
import Pagination from "../../components/Pagination";
import { updateSelectedCar } from "../../store/reducers/appReducer";
import DeleteCarDealerDialog from "../../components/DeleteCarDealerDialog";

const MyCars = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("AllCars");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ✅ FIX: start with empty array (not false)
  const [cars, setCars] = useState([]);

  const { myCars, user } = useSelector((state) => state.app);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [page, setPage] = useState(searchParams.get("page") || 1);

  useEffect(() => {
    document.title = "My-Cars";
  }, []);

  // ✅ FIX: filter cars safely
  useEffect(() => {
    if (!myCars) return;

    if (activeTab === "ActiveCars") {
      setCars(myCars.filter((car) => !car.sold));
    } else if (activeTab === "Ongoing") {
      setCars(myCars.filter((car) => car?.bargain));
    } else if (activeTab === "SoldCars") {
      setCars(myCars.filter((car) => car.sold));
    } else {
      setCars(myCars);
    }
  }, [activeTab, myCars]);

  // ✅ FIX: single API call (no duplicate)
  useEffect(() => {
    if (user?._id) {
      dispatch(asyncGetDealerCars(user._id, page)).then((res) => {
        if (res === 200) console.log("Dealer cars fetched");
        else notifyError("Failed to fetch dealer cars");
      });
    }
  }, [user, page]);

  // ✅ update URL when page changes
  useEffect(() => {
    navigate(`${location.pathname}?page=${page}`);
  }, [page]);

  return (
    <div className="container flex flex-col py-4">
      {/* Tabs */}
      <div className="mt-7 text-xs lg:text-base w-full flex justify-between items-center gap-7">
        <div>
          {["AllCars", "ActiveCars", "Ongoing", "SoldCars"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`p-2 lg:p-4 rounded-t-xl transition-all ${
                activeTab === tab ? "bg-white font-semibold shadow-2xl" : ""
              }`}
            >
              {tab === "AllCars"
                ? "All Cars"
                : tab === "ActiveCars"
                ? "Active Cars"
                : tab === "Ongoing"
                ? "Ongoing Deals"
                : "Sold Cars"}
            </button>
          ))}
        </div>

        <Link
          to="/dealer/add-car"
          className="rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          + Add Car
        </Link>
      </div>

      {/* Cars List */}
      <div className="bg-white p-5 rounded-xl shadow-2xl">
        <ul className="flex flex-col divide-y divide-gray-300 max-h-[100vh] overflow-auto">
          
          {/* ✅ FIX: loading + empty handling */}
          {!myCars ? (
            <div className="flex justify-center items-center h-40">
              <LoaderCircle className="animate-spin" />
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-5">No Cars</div>
          ) : (
            cars.map((car) => (
              <li
                key={car._id}
                onClick={() => {
                  dispatch(updateSelectedCar(car));
                  navigate("/dealer/car-detail");
                }}
                className="flex flex-col sm:flex-row justify-between px-6 py-5 hover:bg-[#E1E9FC60] cursor-pointer"
              >
                <div className="flex w-full space-x-4">
                  
                  {/* Image */}
                  <img
                    src={car.image?.main?.url || car.image || Car_img}
                    alt={car.name}
                    className="h-24 w-24 object-cover rounded"
                  />

                  {/* Details */}
                  <div className="flex flex-col justify-between w-full">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {car.name}
                        </h3>
                        <p className="text-sm">
                          {car.type} | {car.model || "NA"}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ₹ {car.price?.toLocaleString("en-IN")}
                      </p>
                    </div>

                    {/* Actions */}
                    {!car?.sold && (
                      <div className="flex gap-4 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(updateSelectedCar(car));
                            setDeleteOpen(true);
                          }}
                          className="hover:text-red-500 flex items-center gap-1"
                        >
                          <Trash size={16} /> Remove
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(updateSelectedCar(car));
                            navigate("/dealer/edit-car");
                          }}
                          className="hover:text-blue-500 flex items-center gap-1"
                        >
                          <Pencil size={16} /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        setPage={setPage}
        items={myCars?.length || 0}
      />

      {/* Delete Dialog */}
      {deleteOpen && (
        <div
          onClick={() => setDeleteOpen(false)}
          className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black/30"
        >
          <DeleteCarDealerDialog setDeleteOpen={setDeleteOpen} />
        </div>
      )}
    </div>
  );
};

export default MyCars;
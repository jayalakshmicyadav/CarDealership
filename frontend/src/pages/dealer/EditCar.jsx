import { Formik } from "formik";
import Car_img from "/assets/image/car_img1.png";
import InputField from "../../components/formik/InputField";
import * as Yup from "yup";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../../utils/Toast";
import { useNavigate } from "react-router-dom";
import { asyncGetDealerCars, asyncUpdateCar } from "../../store/actions/carActions";
import { CarCapacity, CarTypes } from "../../../constants";

const EditCar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedCar, user } = useSelector((state) => state.app);

  const [description, setDescription] = useState(selectedCar?.description || "");

  const initialValues = {
    type: selectedCar?.type || "",
    name: selectedCar?.name || "",
    model: selectedCar?.model || "",
    door: selectedCar?.door || "",
    air_conditioner: selectedCar?.air_conditioner ? "True" : "False",
    fuel_capacity: selectedCar?.fuel_capacity || "",
    transmission: selectedCar?.transmission || "",
    capacity:
      selectedCar?.capacity >= 8
        ? "8 or More"
        : selectedCar?.capacity
        ? `${selectedCar.capacity} Person`
        : "",
    price: selectedCar?.price || "",
  };

  const validationSchema = Yup.object().shape({
    type: Yup.string().required("Type is required"),
    name: Yup.string().required("Name is required"),
    model: Yup.string().required("Model is required"),
    door: Yup.string().required("Door count is required"),
    air_conditioner: Yup.string().required("AC field is required"),
    fuel_capacity: Yup.string().required("Fuel capacity is required"),
    transmission: Yup.string().required("Transmission is required"),
    capacity: Yup.string().required("Capacity is required"),
    price: Yup.string().required("Price is required"),
  });

  // Existing images from the car (URLs)
  const existingImage = {
    main: selectedCar?.image?.main?.url || Car_img,
    secondary: selectedCar?.image?.secondary?.url || Car_img,
    tertiary: selectedCar?.image?.tertiary?.url || Car_img,
  };

  // New files uploaded by the dealer (null = keep existing)
  const [newImage, setNewImage] = useState({ main: null, secondary: null, tertiary: null });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewImage((prev) => ({ ...prev, [e.target.name]: file }));
  };

  const clearNewImage = (key) => setNewImage((prev) => ({ ...prev, [key]: null }));

  const handleSubmit = (val) => {
    const id = notifyPendingPromise("Updating car...");

    const dataToSend = new FormData();
    dataToSend.append("description", description);
    dataToSend.append("name", val.name);
    dataToSend.append("type", val.type);
    dataToSend.append("model", val.model);
    dataToSend.append("door", val.door);
    dataToSend.append("air_conditioner", val.air_conditioner === "True" ? true : false);
    dataToSend.append("fuel_capacity", val.fuel_capacity);
    dataToSend.append("transmission", val.transmission);
    dataToSend.append("price", val.price);
    dataToSend.append("capacity", Number(val.capacity.split(" ")[0]));
    if (newImage.main) dataToSend.append("images[main]", newImage.main);
    if (newImage.secondary) dataToSend.append("images[secondary]", newImage.secondary);
    if (newImage.tertiary) dataToSend.append("images[tertiary]", newImage.tertiary);

    dispatch(asyncUpdateCar(selectedCar._id, dataToSend)).then((res) => {
      if (res == 200) {
        notifySuccessPromise(id, "Car updated successfully!");
        // Re-fetch dealer cars so myCars state is fresh
        dispatch(asyncGetDealerCars(user._id, 1));
        navigate("/dealer/my-cars");
      } else notifyErrorPromise(id, res.message);
    });
  };

  const ImageSlot = ({ slotKey, label, inputId }) => {
    const previewSrc = newImage[slotKey]
      ? URL.createObjectURL(newImage[slotKey])
      : existingImage[slotKey];
    const isNew = !!newImage[slotKey];

    return (
      <div className="relative h-full w-full rounded-xl overflow-hidden shadow-sm border border-gray-200 group cursor-pointer bg-white">
        <img
          src={previewSrc}
          alt={label}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = Car_img; }}
        />
        {/* hover overlay */}
        <div
          onClick={() => document.getElementById(inputId).click()}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center"
        >
          <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity text-center px-2">
            {isNew ? "Click to change" : "Click to update"}
          </span>
        </div>
        {/* badge */}
        <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
          {label}
        </div>
        {isNew && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clearNewImage(slotKey); }}
            className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full hover:bg-red-600 z-10"
          >
            ✕ Reset
          </button>
        )}
        <input
          onChange={handleImageChange}
          name={slotKey}
          id={inputId}
          className="hidden"
          type="file"
          accept="image/*"
        />
      </div>
    );
  };

  if (!selectedCar) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-gray-500">No car selected. Go back to My Cars.</p>
      </div>
    );
  }

  return (
    <div className="w-full container py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Edit Car</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedCar.name} ({selectedCar.model}) — hover over images to replace them
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── Image panel ── */}
          <div className="flex flex-col gap-4">
            {/* Main image */}
            <div className="h-52">
              <ImageSlot slotKey="main" label="Main" inputId="editMainImage" />
            </div>
            {/* Secondary + Tertiary */}
            <div className="grid grid-cols-2 gap-3 h-32">
              <ImageSlot slotKey="secondary" label="Side" inputId="editSecondaryImage" />
              <ImageSlot slotKey="tertiary" label="Rear" inputId="editTertiaryImage" />
            </div>
            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                id="description"
                rows={3}
                placeholder="Describe the car..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* ── Form panel ── */}
          <div>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(values) => handleSubmit(values)}
            >
              {({ handleBlur, handleChange, handleSubmit, values, errors, touched }) => (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <InputField
                      title="Type" placeHolder="Type" options={CarTypes} type="Select"
                      name="type" handleBlur={handleBlur("type")} handleChange={handleChange("type")}
                      errors={errors?.type} value={values?.type} touched={touched?.type}
                    />
                    <InputField
                      title="Name" placeHolder="Name" name="name"
                      handleBlur={handleBlur("name")} handleChange={handleChange("name")}
                      errors={errors?.name} value={values?.name} touched={touched?.name}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <InputField
                      title="Model" placeHolder="e.g. 2023" name="model"
                      handleBlur={handleBlur("model")} handleChange={handleChange("model")}
                      errors={errors?.model} value={values?.model} touched={touched?.model}
                    />
                    <InputField
                      title="Doors" type="Number" placeHolder="e.g. 4" name="door"
                      handleBlur={handleBlur("door")} handleChange={handleChange("door")}
                      errors={errors?.door} value={values?.door} touched={touched?.door}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <InputField
                      title="Air Conditioner" type="Select" options={["True", "False"]}
                      placeHolder="AC" name="air_conditioner"
                      handleBlur={handleBlur("air_conditioner")} handleChange={handleChange("air_conditioner")}
                      errors={errors?.air_conditioner} value={values?.air_conditioner} touched={touched?.air_conditioner}
                    />
                    <InputField
                      title="Fuel Capacity" type="Number" placeHolder="e.g. 50L" name="fuel_capacity"
                      handleBlur={handleBlur("fuel_capacity")} handleChange={handleChange("fuel_capacity")}
                      errors={errors?.fuel_capacity} value={values?.fuel_capacity} touched={touched?.fuel_capacity}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <InputField
                      title="Transmission" type="Select" options={["Manual", "Automatic"]}
                      placeHolder="Transmission" name="transmission"
                      handleBlur={handleBlur("transmission")} handleChange={handleChange("transmission")}
                      errors={errors?.transmission} value={values?.transmission} touched={touched?.transmission}
                    />
                    <InputField
                      title="Price (₹)" type="Number" placeHolder="e.g. 1500000" name="price"
                      handleBlur={handleBlur("price")} handleChange={handleChange("price")}
                      errors={errors?.price} value={values?.price} touched={touched?.price}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <InputField
                      title="Capacity" type="Select" options={CarCapacity}
                      placeHolder="Capacity" name="capacity"
                      handleBlur={handleBlur("capacity")} handleChange={handleChange("capacity")}
                      errors={errors?.capacity} value={values?.capacity} touched={touched?.capacity}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => navigate("/dealer/my-cars")}
                      className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      type="button"
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-5 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCar;

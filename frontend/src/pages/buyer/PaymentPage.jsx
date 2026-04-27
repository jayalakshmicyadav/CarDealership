import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CheckCircle, CreditCard, Lock, ChevronLeft } from "lucide-react";
import CarImg from "/assets/image/car_img1.png";
import { sellCar } from "../../store/reducers/appReducer";
import { notifyError, notifySuccess } from "../../utils/Toast";

const getImageUrl = (image) =>
  typeof image === "string" ? image : image?.main?.url || CarImg;

const PaymentPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedCar, user } = useSelector((state) => state.app);

  const [step, setStep] = useState("form"); // "form" | "success"
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    upiId: "",
    method: "card",
  });
  const [errors, setErrors] = useState({});

  if (!selectedCar) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No car selected.{" "}
        <button onClick={() => navigate("/cars")} className="ml-2 text-blue-600 underline">
          Browse Cars
        </button>
      </div>
    );
  }

  const price = (() => {
    const idx = selectedCar.bargained?.findIndex((b) => b.id === user?._id) ?? -1;
    return idx !== -1 && selectedCar.bargained[idx]?.price !== -1
      ? selectedCar.bargained[idx].price
      : selectedCar.price;
  })();

  const formatCard = (val) =>
    val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const validate = () => {
    const e = {};
    if (form.method === "card") {
      if (!form.cardName.trim()) e.cardName = "Name is required";
      if (form.cardNumber.replace(/\s/g, "").length !== 16)
        e.cardNumber = "Enter a valid 16-digit card number";
      if (!/^\d{2}\/\d{2}$/.test(form.expiry)) e.expiry = "Enter expiry as MM/YY";
      if (form.cvv.length < 3) e.cvv = "CVV must be 3-4 digits";
    } else {
      if (!form.upiId.includes("@")) e.upiId = "Enter a valid UPI ID (e.g. name@upi)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      dispatch(sellCar(selectedCar._id));
      setLoading(false);
      setStep("success");
    }, 2000);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 mb-1">
            You bought <span className="font-semibold">{selectedCar.name} {selectedCar.model}</span>
          </p>
          <p className="text-gray-400 text-sm mb-6">
            ₹ {price?.toLocaleString("en-IN")} has been debited from your account.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Order ID</span>
              <span className="font-mono">
                TXN{Date.now().toString().slice(-8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Buyer</span>
              <span>{user?.user_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-green-600 font-semibold">Completed</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/buyer/my-cars")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            View My Cars
          </button>
          <button
            onClick={() => navigate("/cars")}
            className="w-full mt-3 text-blue-600 hover:underline text-sm"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_380px] gap-6">
        {/* Payment form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" /> Checkout
          </h2>
          <p className="text-sm text-gray-400 mb-6 flex items-center gap-1">
            <Lock size={12} /> Secure & encrypted payment
          </p>

          {/* Payment method tabs */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6">
            {["card", "upi"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm((f) => ({ ...f, method: m }))}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.method === m
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {m === "card" ? "Credit / Debit Card" : "UPI"}
              </button>
            ))}
          </div>

          {form.method === "card" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name on Card
                </label>
                <input
                  value={form.cardName}
                  onChange={(e) => setForm((f) => ({ ...f, cardName: e.target.value }))}
                  placeholder="Jaya Lakshmi"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cardName ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.cardName && (
                  <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Card Number
                </label>
                <input
                  value={form.cardNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cardNumber: formatCard(e.target.value) }))
                  }
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cardNumber ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    value={form.expiry}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiry: formatExpiry(e.target.value) }))
                    }
                    placeholder="08/28"
                    maxLength={5}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expiry ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.expiry && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                  <input
                    value={form.cvv}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    placeholder="•••"
                    type="password"
                    maxLength={4}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cvv ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.cvv && (
                    <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">UPI ID</label>
              <input
                value={form.upiId}
                onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
                placeholder="yourname@upi"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.upiId ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.upiId && (
                <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                A payment request will be sent to your UPI app.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <Lock size={16} />
                Pay ₹ {price?.toLocaleString("en-IN")}
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            This is a demo payment. No real transaction will occur.
          </p>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
            <img
              src={getImageUrl(selectedCar.image)}
              alt={selectedCar.name}
              className="w-full h-44 object-cover"
              onError={(e) => { e.target.src = CarImg; }}
            />
          </div>
          <p className="font-semibold text-gray-900 text-lg">
            {selectedCar.name}{" "}
            <span className="font-normal text-gray-500">({selectedCar.model})</span>
          </p>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{selectedCar.type}</p>

          <div className="mt-4 space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
            {[
              ["Transmission", selectedCar.transmission || "—"],
              ["Capacity", selectedCar.capacity ? `${selectedCar.capacity} Persons` : "—"],
              ["Air Conditioner", selectedCar.air_conditioner ? "Yes" : "No"],
              ["Fuel Capacity", selectedCar.fuel_capacity ? `${selectedCar.fuel_capacity} L` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-400">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Base Price</span>
              <span>₹ {selectedCar.price?.toLocaleString("en-IN")}</span>
            </div>
            {price !== selectedCar.price && (
              <div className="flex justify-between text-sm text-green-600 mt-1">
                <span>Bargain Discount</span>
                <span>- ₹ {(selectedCar.price - price)?.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base mt-3">
              <span>Total</span>
              <span>₹ {price?.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

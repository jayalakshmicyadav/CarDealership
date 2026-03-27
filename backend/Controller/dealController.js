const Car = require("../Models/carSchema");
const Buyer = require("../Models/buyerSchema");
const Deal = require("../Models/dealSchema");
const Dealer = require("../Models/dealerSchema");
const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const ErrorHandler = require("../Utils/ErrorHandler");
const crypto = require("crypto");
const Razorpay = require("razorpay");

var razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//make-payment
exports.makePayment = catchAsyncErrors(async (req, res, next) => {
  const { carId, userId } = req.body;
  const car = await Car.findById(carId);

  console.log({ carId, userId });
  const userPresent = car.bargained?.findIndex(
    (bargain) => bargain.id == userId
  );

  console.log({ userPresent });
  let carPrice;
  if (userPresent != -1)
    carPrice = Number(
      car.bargained[userPresent]?.price != -1
        ? car.bargained[userPresent].price
        : car.price
    );
  else carPrice = car.price;

  console.log({ carPrice });
  // return;
  try {
    const order = await razorpay.orders.create({
      amount: carPrice,
      currency: "INR",
      receipt: car._id,
      partial_payment: false,
    });

    console.log("Order----", { order });
    res.status(200).json(order);
  } catch (error) {
    console.log(error);
  }
});

//Payment Verification
exports.verifyPayment = catchAsyncErrors(async (req, res, next) => {
  const { response, carId } = req.body;

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    response;

  console.log({
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    carId,
    body: req.body,
  });

  let body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");
  console.log({ expectedSignature, signature: razorpay_signature });

  const isAuthentic = expectedSignature == razorpay_signature;

  if (isAuthentic) {
    return res.status(200).json(isAuthentic);
  } else {
    res.status(400).json({
      success: false,
    });
  }
});

//Buy car
exports.buyCar = catchAsyncErrors(async (req, res, next) => {
  const car_id = req.params.id;
  const buyer_id = req.userId;

  // Find the car
  const car = await Car.findById(car_id);
  if (!car) {
    return next(new ErrorHandler("Car not found", 404));
  }

  //   Find the dealer
  const dealer = await Dealer.findById(car.dealer_id);
  if (!dealer) {
    return next(new ErrorHandler("Dealer not found", 404));
  }

  //   Find the buyer
  const buyer = await Buyer.findById(buyer_id);
  if (!buyer) {
    return next(new ErrorHandler("Buyer not found", 404));
  }

  const soldCar = await Deal.findOne({ car_id: car._id });
  if (soldCar) return next(new ErrorHandler("Car sold already", 401));

  const userPresent = car.bargained?.findIndex(
    (bargain) => bargain.id == buyer_id
  );

  let carPrice;
  if (userPresent != -1)
    carPrice = Number(
      car.bargained[userPresent]?.price != -1 ? car.bargained[userPresent].price : car.price
    );
  else carPrice = car.price;

  // Create the deal
  const deal = await Deal.create({
    car_id,
    buyer_id,
    dealer_id: dealer._id,
    price: carPrice,
    order_id: req.body.response.razorpay_order_id,
    payment_id: req.body.response.razorpay_payment_id,
  });

  if (!deal) return next(new ErrorHandler("Unable to make deal", 500));

  // Update the car
  car.sold = true;
  car.buyer_id = buyer_id;
  car.deal = deal._id;

  // Update the dealer
  dealer.deals.push(deal._id);

  //   Update the buyer
  buyer.deals.push(deal._id);
  buyer.cars.push(car._id);

  //Save the changes
  await car.save();
  await dealer.save();
  await buyer.save();

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({
    message: "Car bought successfully",
    deal,
    newAccessToken,
  });
});

//Get Deal by id
exports.getDealById = catchAsyncErrors(async (req, res, next) => {
  const deal = await Deal.findById(req.params.id)
    .populate({ path: "car_id", model: "Car", options: { lean: true } })
    .populate({ path: "buyer_id", model: "Buyer", options: { lean: true } })
    .populate({ path: "dealer_id", model: "Dealer", options: { lean: true } })
    .lean();

  if (!deal) {
    return res.status(404).json({ message: "Deal not found" });
  }

  if (!deal.car_id) {
    deal.car_id = "deleted";
  }

  if (!deal.buyer_id) {
    deal.buyer_id = "deleted";
  }

  if (!deal.dealer_id) {
    deal.dealer_id = "deleted";
  }

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({ deal, newAccessToken });
});

//Get Dealer deals
exports.getDealerDeals = catchAsyncErrors(async (req, res, next) => {
  const deals = await Deal.find({ dealer_id: req.params.id })
    .populate({
      path: "car_id",
      model: "Car",
      select: "image.main.url name type",
      options: { lean: true },
    })
    .populate({
      path: "buyer_id",
      model: "Buyer",
      select: "user_name email",
      options: { lean: true },
    })
    .lean();

  const modifiedDeals = deals.map((deal) => {
    if (!deal.car_id) {
      deal.car_id = "deleted";
    }

    if (!deal.buyer_id) {
      deal.buyer_id = "deleted";
    }

    if (!deal.dealer_id) {
      deal.dealer_id = "deleted";
    }

    return deal;
  });

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({ deals: modifiedDeals, newAccessToken });
});

//Get Buyer deals
exports.getBuyerDeals = catchAsyncErrors(async (req, res, next) => {
  const deals = await Deal.find({ buyer_id: req.params.id })
    .populate({ path: "car_id", model: "Car", options: { lean: true } })
    .populate({ path: "buyer_id", model: "Buyer", options: { lean: true } })
    .populate({ path: "dealer_id", model: "Dealer", options: { lean: true } })
    .lean();

  const modifiedDeals = deals.map((deal) => {
    if (!deal.car_id) {
      deal.car_id = "deleted";
    }

    if (!deal.buyer_id) {
      deal.buyer_id = "deleted";
    }

    if (!deal.dealer_id) {
      deal.dealer_id = "deleted";
    }

    return deal;
  });

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({ deals: modifiedDeals, newAccessToken });
});

//Get All Deals
exports.getAllDeals = catchAsyncErrors(async (req, res, next) => {
  const deals = await Deal.find()
    .populate({
      path: "car_id",
      model: "Car",
      options: { lean: true },
    })
    .populate({ path: "buyer_id", model: "Buyer", options: { lean: true } })
    .populate({ path: "dealer_id", model: "Dealer", options: { lean: true } })
    .lean();

  const modifiedDeals = deals.map((deal) => {
    if (!deal.car_id) {
      deal.car_id = { message: "deleted" };
    }

    if (!deal.buyer_id) {
      deal.buyer_id = { message: "deleted" };
    }

    if (!deal.dealer_id) {
      deal.dealer_id = { message: "deleted" };
    }

    return deal;
  });

  let newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({ deals: modifiedDeals, newAccessToken });
});

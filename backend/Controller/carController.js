const { validationResult, body } = require("express-validator");
const { catchAsyncErrors } = require("../Middleware/catchAsyncErrors");
const ErrorHandler = require("../Utils/ErrorHandler");
const Car = require("../Models/carSchema");
const Dealer = require("../Models/dealerSchema");
let imageKit = require("../Utils/imageKit").initImageKit();
const path = require("path");

const validateInput = [
  body("type").notEmpty().withMessage("Type is required to create car"),
  body("name").notEmpty().withMessage("Name is required to create car"),
  body("model").notEmpty().withMessage("Model is required to create car"),
];

//CREATE CAR
exports.createCar = [
  // ...validateInput,
  catchAsyncErrors(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.errors[0].msg);
      // const errorMessages = errors
      //   .array()
      //   .map((error) => error.msg)
      //   .join(", ");
      return next(new ErrorHandler(errors.errors[0].msg, 400));
    }

    // const mainImage = req.files["images[main]"];
    // const secondaryImage = req.files["images[secondary]"];
    // const tertiaryImage = req.files["images[tertiary]"];
    // console.log({ mainImage, secondaryImage, tertiaryImage });
    // return;

    // const { type, name, model, price, capacity } = req.body;
    console.log(req.body);
    const car = await Car(req.body);

    if (req.files && imageKit) {
      const mainImage = req.files["images[main]"];
      const secondaryImage = req.files["images[secondary]"];
      const tertiaryImage = req.files["images[tertiary]"];

      if (mainImage && secondaryImage && tertiaryImage) {
        const modifiedMainImgName = `car-main-${Date.now()}${path.extname(
          mainImage.name
        )}`;
        const modifiedSecondaryImgName = `car-secondary-${Date.now()}${path.extname(
          secondaryImage.name
        )}`;
        const modifiedTertiaryImgName = `car-tertiary-${Date.now()}${path.extname(
          tertiaryImage.name
        )}`;

        const { fileId: mainFileId, url: mainUrl } = await imageKit.upload({
          file: mainImage.data,
          fileName: modifiedMainImgName,
        });

        const { fileId: secondaryFileId, url: secondaryUrl } =
          await imageKit.upload({
            file: secondaryImage.data,
            fileName: modifiedSecondaryImgName,
          });

        const { fileId: tertiaryFileId, url: tertiaryUrl } =
          await imageKit.upload({
            file: tertiaryImage.data,
            fileName: modifiedTertiaryImgName,
          });

        car.image = {
          main: { fileId: mainFileId, url: mainUrl },
          secondary: { fileId: secondaryFileId, url: secondaryUrl },
          tertiary: { fileId: tertiaryFileId, url: tertiaryUrl },
        };
      } else {
        console.error("One or more images are missing.");
      }
    }

    car.dealer_id = req.userId;

    const dealer = await Dealer.findByIdAndUpdate(
      req.userId,
      { $push: { cars: car._id } },
      { new: true }
    );
    if (!dealer) return next(new ErrorHandler("Dealer not found", 404));

    await car.save();

    const newAccessToken = req.newAccessToken;
    delete req.newAccessToken;

    res.status(200).json({
      message: "Car created successfully!",
      car,
      newAccessToken,
    });
  }),
];

//GET ALL CARS
// exports.getAllCars = catchAsyncErrors(async (req, res, next) => {
//   const page = parseInt(req.query.page) || 1; // Extract page from query parameter, default to 1 if not provided
//   const types = req.query.type ? req.query.type.split(",") : []; // Extract types from query parameter
//   const minCapacity = req.query.capacity
//     ? parseInt(req.query.capacity)
//     : undefined; // Extract capacities from query parameter

//   // Calculate start and end indices based on the requested page
//   const pageSize = 20; // Number of cars per page
//   const start = (page - 1) * pageSize;
//   const end = start + pageSize;

//   // Construct query object based on types and capacities
//   const query = {};
//   if (types.length > 0) query.type = { $in: types };
//   if (minCapacity !== undefined) query.capacity = { $gte: minCapacity };

//   // Fetch cars based on query and pagination
//   const cars = await Car.find(query)
//     .sort({ createdAt: -1 })
//     .skip(start)
//     .limit(pageSize);

//   res.status(200).json({ cars });
// });

exports.getAllCars = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1; // Extract page from query parameter, default to 1 if not provided
  const types = req.query.type ? req.query.type.split(",") : []; // Extract types from query parameter
  const capacities = req.query.capacity ? req.query.capacity.split(",") : []; // Extract capacities from query parameter

  // Calculate start and end indices based on the requested page
  const pageSize = 20; // Number of cars per page
  const start = (page - 1) * pageSize;

  // Construct query object based on types
  const query = {};
  if (types.length > 0) query.type = { $in: types };

  // If no capacities provided, fetch all cars for the specified page
  if (capacities.length === 0) {
    const cars = await Car.find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(pageSize)
      .populate({
        path: "dealer_id",
        select: "user_name", // Populate only the user_name field of the dealer_id reference
      })
      .populate({
        path: "review",
        select: "rating comment",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "buyer_id",
          select: "user_name", // Populate only the user_name field of the buyer_id reference
        },
      });

    res.status(200).json({ cars });
    return;
  }

  // Fetch cars based on query and pagination
  let cars = [];

  for (let capacity of capacities) {
    // Parse the capacity value as an integer
    capacity = parseInt(capacity);

    if (isNaN(capacity)) {
      // Skip if capacity value is not a valid number
      continue;
    }

    let capacityQuery = { ...query };

    if (capacity === 8) {
      // For capacity 8 or more, fetch all capacities greater than or equal to 8
      capacityQuery.capacity = { $gte: 8 };
    } else {
      // For other capacities, fetch the requested capacity only
      capacityQuery.capacity = capacity;
    }

    // Fetch cars for the current capacity value
    const carsForCapacity = await Car.find(capacityQuery)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .populate({
        path: "dealer_id",
        select: "user_name", // Populate only the user_name field of the dealer_id reference
      })
      .populate({
        path: "review",
        select: "rating comment",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "buyer_id",
          select: "user_name", // Populate only the user_name field of the buyer_id reference
        },
      });

    console.log({ carsForCapacity });

    // Concatenate the fetched cars to the result array
    cars = cars.concat(carsForCapacity);
  }

  // Sort the result array by createdAt date
  cars.sort((a, b) => b.createdAt - a.createdAt);

  // Paginate the result array
  cars = cars.slice(start, start + pageSize);

  res.status(200).json({ cars });
});

//GET CAR BY ID
exports.getCarByID = catchAsyncErrors(async (req, res, next) => {
  const car = await Car.findById(req.params.id);

  res.status(200).json({ car });
});

//GET DEALER CARS
exports.getDealerCars = catchAsyncErrors(async (req, res, next) => {
  const page = req.query.page || 1;

  const end = page * 10;
  const start = end - 10;

  const cars = await Car.find({ dealer_id: req.params.id })
    .sort({
      createdAt: -1,
    }) // Sort by createdAt field in descending order
    .skip(start) // Skip the first 'start' number of documents
    .limit(end - start)
    .populate({
      path: "review",
      select: "rating comment",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "buyer_id",
        select: "user_name", // Populate only the user_name field of the buyer_id reference
      },
    });

  console.log({ length: cars.length, start, end });

  newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({
    cars,
    newAccessToken,
  });
});

//UPDATE CAR BY ID
exports.updateCarByID = catchAsyncErrors(async (req, res, next) => {
  const car = await Car.findById(req.params.id);

  if (!car) return next(new ErrorHandler("Car not found", 404));

  if (car.dealer_id != req.userId)
    return next(new ErrorHandler("Unauthorized dealer", 500));

  const {
    description,
    type,
    name,
    door,
    air_conditioner,
    fuel_capacity,
    transmission,
    model,
    capacity,
    price,
  } = req.body;

  console.log({ body: req.body, file: req.files });

  let [mainImage, secondaryImage, tertiaryImage] = [null, null, null];
  if (req.files) {
    console.log("file present");
    mainImage = req.files["images[main]"];
    secondaryImage = req.files["images[secondary]"];
    tertiaryImage = req.files["images[tertiary]"];
  }

  console.log({
    mainImage,
    secondaryImage,
    tertiaryImage,
    description,
    type,
    name,
    door,
    air_conditioner,
    fuel_capacity,
    transmission,
    model,
    capacity,
    price,
  });

  if (type) car.type = type;

  if (name) car.name = name;

  if (model) car.model = model;

  if (capacity) car.capacity = capacity;

  if (price) car.price = price;

  if (description) car.description = description;

  if (car.door) car.door = door;

  if (car.air_conditioner) car.air_conditioner = air_conditioner;

  if (car.fuel_capacity) car.fuel_capacity = fuel_capacity;

  if (transmission) car.transmission = transmission;

  if (imageKit && mainImage) {
  await imageKit.deleteFile(car.image.main.fileId).catch(() => {});
  
  const { fileId, url } = await imageKit.upload({
    file: mainImage.data,
    fileName: modifiedMainImgName,
  });

  car.image.main = { fileId, url };
}

  if (secondaryImage) {
    await imageKit
      .deleteFile(car.image.secondary.fileId)
      .catch((err) => console.log(err));

    const modifiedSecondaryImgName = `car-main-${Date.now()}${path.extname(
      secondaryImage.name
    )}`;
    const { fileId, url } = await imageKit.upload({
      file: secondaryImage.data,
      fileName: modifiedSecondaryImgName,
    });
    car.image.secondary = { fileId, url };
  }

  if (tertiaryImage) {
    await imageKit
      .deleteFile(car.image.tertiary.fileId)
      .catch((err) => console.log("Deleting error:-", err));

    const modifiedTertiaryImgName = `car-main-${Date.now()}${path.extname(
      tertiaryImage.name
    )}`;

    const { fileId, url } = await imageKit.upload({
      file: tertiaryImage.data,
      fileName: modifiedTertiaryImgName,
    });
    console.log(fileId, url);
    car.image.tertiary = { fileId, url };
  }

  const updatedCar = await car.save();

  newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  res.status(200).json({
    message: "Car updated successfully!",
    updatedCar,
    newAccessToken,
  });
});

//UPDATE CAR IMG BY ID
exports.updateCarImgByID = catchAsyncErrors(async (req, res, next) => {
  const car = await Car.findById(req.params.id);

  if (!car) return next(new ErrorHandler("Car not found", 404));

  if (car.dealer_id != req.userId)
    return next(new ErrorHandler("Unauthorized dealer", 500));

  if (car.image.fileId !== "") {
    await imageKit.deleteFile(car.image.fileId);
  }

  const newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  if (!req.files) {
    return res.status(201).json({
      message: "No image received!",
      newAccessToken,
    });
  }

  const image = req.files.image;
  const modifiedImgName = `car-${Date.now()}${path.extname(image.name)}`;

  const { fileId, url } = await imageKit.upload({
    file: image.data,
    fileName: modifiedImgName,
  });

  car.image = { fileId, url };

  const updatedCar = await car.save();

  res.status(200).json({
    message: "Car image updated successfully!",
    updateImgUrl: updatedCar.image.url,
    newAccessToken,
  });
});

// DELETE CAR BY ID
exports.deleteCarById = catchAsyncErrors(async (req, res, next) => {
  console.log(req.params.id);

  const deletedCar = await Car.findByIdAndDelete(req.params.id);
  if (!deletedCar) {
    return next(new ErrorHandler("Car not found", 404));
  }

  // ✅ SAFE IMAGEKIT HANDLING
  if (imageKit && deletedCar.image) {
    try {
      if (deletedCar.image.main?.fileId) {
        await imageKit.deleteFile(deletedCar.image.main.fileId);
      }
      if (deletedCar.image.secondary?.fileId) {
        await imageKit.deleteFile(deletedCar.image.secondary.fileId);
      }
      if (deletedCar.image.tertiary?.fileId) {
        await imageKit.deleteFile(deletedCar.image.tertiary.fileId);
      }
    } catch (err) {
      console.log("ImageKit delete error:", err.message);
    }
  } else {
    console.log("⚠️ ImageKit not configured, skipping delete");
  }

  await Dealer.findByIdAndUpdate(
    req.userId,
    { $pull: { cars: deletedCar._id } },
    { new: true }
  );

  const newAccessToken = req.newAccessToken;
  delete req.newAccessToken;

  return res.status(200).json({
    message: "Car deleted successfully",
    deletedCar: deletedCar._id,
    newAccessToken,
  });
});
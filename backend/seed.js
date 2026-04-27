require("dotenv").config();
const mongoose = require("mongoose");
const https = require("https");
const Dealer = require("./Models/dealerSchema");
const Buyer = require("./Models/buyerSchema");
const Car = require("./Models/carSchema");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cars";

// ─── Wikipedia image fetcher ──────────────────────────────────────────
const getWikiImage = (title) =>
  new Promise((resolve) => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    https
      .get(url, { headers: { "User-Agent": "CarDealershipSeed/1.0" } }, (res) => {
        let raw = "";
        res.on("data", (d) => (raw += d));
        res.on("end", () => {
          try {
            const data = JSON.parse(raw);
            const img = data.originalimage?.source || data.thumbnail?.source || null;
            resolve(img);
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });

// For side/rear angles, fetch a second Wikipedia page about the same make/model
const getWikiImageAlt = (title) => getWikiImage(title);

// ─── Fallback images per car type (used when Wikipedia has no image) ──
const TYPE_FALLBACKS = {
  Sport:    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/2022_Ferrari_296_GTB_%28front%29.jpg/1280px-2022_Ferrari_296_GTB_%28front%29.jpg",
  Suv:      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/2023_Toyota_RAV4_XLE_in_Blueprint%2C_front_left.jpg/1280px-2023_Toyota_RAV4_XLE_in_Blueprint%2C_front_left.jpg",
  MPV:      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/2022_Kia_Carnival_EX%2B_in_Snow_White_Pearl%2C_front_left.jpg/1280px-2022_Kia_Carnival_EX%2B_in_Snow_White_Pearl%2C_front_left.jpg",
  Sedan:    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/2021_Toyota_Camry_XSE_in_Blueprint%2C_front_8.6.21.jpg/1280px-2021_Toyota_Camry_XSE_in_Blueprint%2C_front_8.6.21.jpg",
  Coupe:    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/2017_Mercedes-AMG_GT_C_%28C190%29_roadster_%2826680523489%29.jpg/1280px-2017_Mercedes-AMG_GT_C_%28C190%29_roadster_%2826680523489%29.jpg",
  Hatchback:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/2020_Volkswagen_Golf_Life_1.5_TSI_front.jpg/1280px-2020_Volkswagen_Golf_Life_1.5_TSI_front.jpg",
};

// ─── Car definitions ──────────────────────────────────────────────────
// wikiMain  → Wikipedia article for the main (front) image
// wikiSide  → Wikipedia article for the secondary (side/different angle) image
// wikiRear  → Wikipedia article for the tertiary image (rear make/brand page, etc.)
const CAR_DEFS = [
  // ── SPORT ────────────────────────────────────────────────────────
  {
    type:"Sport", name:"BMW M4", model:"2023", door:2, air_conditioner:true,
    fuel_capacity:"59L", transmission:"Automatic", capacity:2, price:9200000,
    rating:4.8,
    description:"Twin-turbo inline-6, 510 hp. Track-focused German engineering. M xDrive AWD, carbon fibre roof, adaptive M suspension.",
    wikiMain:"BMW M4", wikiSide:"BMW M3", wikiRear:"BMW M Series",
    _dealer:0,
  },
  {
    type:"Sport", name:"Porsche 911", model:"2022", door:2, air_conditioner:true,
    fuel_capacity:"67L", transmission:"Automatic", capacity:4, price:18500000,
    rating:4.9,
    description:"Iconic rear-engine sports car. 3.0L flat-six, 443 hp, PDK dual-clutch. 0–100 km/h in 3.5 s. Timeless design.",
    wikiMain:"Porsche 911", wikiSide:"Porsche 992", wikiRear:"Porsche",
    _dealer:0,
  },
  {
    type:"Sport", name:"Toyota GR Supra", model:"2023", door:2, air_conditioner:true,
    fuel_capacity:"52L", transmission:"Automatic", capacity:2, price:7500000,
    rating:4.7,
    description:"BMW-sourced 3.0L turbocharged straight-six, 382 hp. RWD, electronically controlled differential. A legend reborn.",
    wikiMain:"Toyota GR Supra", wikiSide:"Toyota Supra", wikiRear:"Toyota GR",
    _dealer:1,
  },
  {
    type:"Sport", name:"Ford Mustang GT", model:"2023", door:2, air_conditioner:true,
    fuel_capacity:"61L", transmission:"Manual", capacity:4, price:6800000,
    rating:4.6,
    description:"5.0L V8 Coyote engine, 450 hp. Classic pony-car muscle. MagneRide suspension, Brembo brakes.",
    wikiMain:"Ford Mustang", wikiSide:"Ford Mustang (sixth generation)", wikiRear:"Ford Mustang GT",
    _dealer:2,
  },

  // ── SUV ──────────────────────────────────────────────────────────
  {
    type:"Suv", name:"Toyota Fortuner", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"80L", transmission:"Automatic", capacity:7, price:4500000,
    rating:4.7,
    description:"India's best-selling premium SUV. 2.8L diesel 204 hp, 4WD with locking diff. Commanding road presence.",
    wikiMain:"Toyota Fortuner", wikiSide:"Toyota Land Cruiser Prado", wikiRear:"Toyota Hilux",
    _dealer:0,
  },
  {
    type:"Suv", name:"Mahindra Thar", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"57L", transmission:"Manual", capacity:4, price:1800000,
    rating:4.5,
    description:"India's iconic off-roader reimagined. 2.2L mHawk diesel, 130 hp, 4WD with low-range, ESP and hill descent.",
    wikiMain:"Mahindra Thar", wikiSide:"Mahindra Scorpio", wikiRear:"Mahindra & Mahindra",
    _dealer:1,
  },
  {
    type:"Suv", name:"Hyundai Creta", model:"2024", door:4, air_conditioner:true,
    fuel_capacity:"50L", transmission:"Automatic", capacity:5, price:2200000,
    rating:4.6,
    description:"India's most popular compact SUV. 1.5L turbo petrol, 160 hp, panoramic sunroof, ADAS Level 2, 360° camera.",
    wikiMain:"Hyundai Creta", wikiSide:"Hyundai Tucson", wikiRear:"Hyundai ix25",
    _dealer:2,
  },
  {
    type:"Suv", name:"Range Rover Sport", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"90L", transmission:"Automatic", capacity:5, price:12500000,
    rating:4.8,
    description:"3.0L inline-6 mild hybrid, 400 hp. Terrain Response 2, Configurable Dynamics, air suspension.",
    wikiMain:"Range Rover Sport", wikiSide:"Land Rover Discovery", wikiRear:"Range Rover",
    _dealer:0,
  },

  // ── MPV ──────────────────────────────────────────────────────────
  {
    type:"MPV", name:"Toyota Innova HyCross", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"52L", transmission:"Automatic", capacity:7, price:2900000,
    rating:4.8,
    description:"India's most loved premium MPV. Strong hybrid 2.0L, 186 hp, captain seats, ventilated seats.",
    wikiMain:"Toyota Innova", wikiSide:"Toyota Innova Crysta", wikiRear:"Toyota Vellfire",
    _dealer:1,
  },
  {
    type:"MPV", name:"Kia Carnival", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"60L", transmission:"Automatic", capacity:8, price:3500000,
    rating:4.6,
    description:"Limousine-class MPV. 2.2L CRDi diesel, 202 hp, VIP lounge second row, 11-speaker Bose audio, sliding power doors.",
    wikiMain:"Kia Carnival", wikiSide:"Kia Sedona", wikiRear:"Kia",
    _dealer:2,
  },
  {
    type:"MPV", name:"Maruti Ertiga", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"45L", transmission:"Automatic", capacity:7, price:1100000,
    rating:4.4,
    description:"India's best-value MPV. 1.5L K15C mild hybrid, 103 hp, SmartPlay Pro+ infotainment, 6 airbags. Practical and economical.",
    wikiMain:"Maruti Suzuki Ertiga", wikiSide:"Suzuki Ertiga", wikiRear:"Maruti Suzuki",
    _dealer:0,
  },

  // ── SEDAN ────────────────────────────────────────────────────────
  {
    type:"Sedan", name:"Honda City", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"40L", transmission:"Automatic", capacity:5, price:1500000,
    rating:4.5,
    description:"India's premium C-segment sedan. 1.5L i-VTEC 121 hp or strong hybrid. Honda Sensing ADAS, wireless Android Auto.",
    wikiMain:"Honda City", wikiSide:"Honda Civic", wikiRear:"Honda",
    _dealer:1,
  },
  {
    type:"Sedan", name:"Hyundai Verna", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"45L", transmission:"Automatic", capacity:5, price:1750000,
    rating:4.6,
    description:"Segment-first 1.5L turbo petrol, 160 hp. 10.25\" dual screen, ADAS Level 2, panoramic sunroof, ventilated seats.",
    wikiMain:"Hyundai Verna", wikiSide:"Hyundai Elantra", wikiRear:"Hyundai Accent",
    _dealer:2,
  },
  {
    type:"Sedan", name:"Mercedes C-Class", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"66L", transmission:"Automatic", capacity:5, price:6500000,
    rating:4.9,
    description:"Luxury redefined. 2.0L turbocharged inline-4, 204 hp, 48V mild hybrid. 11.9\" portrait touchscreen, MBUX.",
    wikiMain:"Mercedes-Benz C-Class", wikiSide:"Mercedes-Benz W206", wikiRear:"Mercedes-Benz E-Class",
    _dealer:0,
  },
  {
    type:"Sedan", name:"Skoda Octavia", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"55L", transmission:"Automatic", capacity:5, price:3200000,
    rating:4.5,
    description:"1.5L TSI EVO, 150 hp, 7-speed DSG. Spacious 600L boot, virtual cockpit, wireless charging, Canton sound.",
    wikiMain:"Škoda Octavia", wikiSide:"Skoda Superb", wikiRear:"Volkswagen Passat",
    _dealer:1,
  },

  // ── COUPE ────────────────────────────────────────────────────────
  {
    type:"Coupe", name:"Mercedes-AMG GT", model:"2023", door:2, air_conditioner:true,
    fuel_capacity:"75L", transmission:"Automatic", capacity:2, price:22000000,
    rating:4.9,
    description:"4.0L V8 biturbo, 630 hp AMG GT 63 S. Rear-wheel steering, AMG Traction Control, carbon ceramic brakes.",
    wikiMain:"Mercedes-AMG GT", wikiSide:"Mercedes-AMG C 63", wikiRear:"Mercedes-AMG",
    _dealer:2,
  },
  {
    type:"Coupe", name:"Audi TT RS", model:"2023", door:2, air_conditioner:true,
    fuel_capacity:"55L", transmission:"Automatic", capacity:4, price:8900000,
    rating:4.7,
    description:"2.5L TFSI inline-5, 400 hp, quattro AWD. Iconic design, virtual cockpit as standard, Bang & Olufsen 3D sound.",
    wikiMain:"Audi TT", wikiSide:"Audi TT RS", wikiRear:"Audi R8",
    _dealer:0,
  },
  {
    type:"Coupe", name:"Toyota GR86", model:"2023", door:2, air_conditioner:true,
    fuel_capacity:"50L", transmission:"Manual", capacity:4, price:4200000,
    rating:4.7,
    description:"New 2.4L naturally aspirated flat-four, 234 hp, RWD. 55/45 weight distribution. The purist's sports coupe.",
    wikiMain:"Toyota GR86", wikiSide:"Subaru BRZ", wikiRear:"Toyota 86",
    _dealer:1,
  },

  // ── HATCHBACK ────────────────────────────────────────────────────
  {
    type:"Hatchback", name:"Maruti Swift", model:"2024", door:4, air_conditioner:true,
    fuel_capacity:"37L", transmission:"Automatic", capacity:5, price:750000,
    rating:4.4,
    description:"India's best-selling car reborn. 1.2L Z12E mild hybrid, 82 hp. SmartPlay Pro+ 9\", 6 airbags. 25.75 km/L ARAI.",
    wikiMain:"Maruti Suzuki Swift", wikiSide:"Suzuki Swift", wikiRear:"Suzuki",
    _dealer:2,
  },
  {
    type:"Hatchback", name:"Hyundai i20", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"37L", transmission:"Automatic", capacity:5, price:1100000,
    rating:4.5,
    description:"1.0L turbo GDi, 120 hp, 7-speed DCT. Bose premium sound, wireless Android/Apple, sunroof. Premium hatchback.",
    wikiMain:"Hyundai i20", wikiSide:"Hyundai i30", wikiRear:"Hyundai Venue",
    _dealer:0,
  },
  {
    type:"Hatchback", name:"Volkswagen Polo", model:"2023", door:4, air_conditioner:true,
    fuel_capacity:"40L", transmission:"Automatic", capacity:5, price:1250000,
    rating:4.6,
    description:"1.0L TSI, 110 hp, 6-speed torque converter. German build quality, 95L boot. Solid and refined.",
    wikiMain:"Volkswagen Polo", wikiSide:"Volkswagen Golf", wikiRear:"Volkswagen",
    _dealer:1,
  },
  {
    type:"Hatchback", name:"Tata Altroz", model:"2024", door:4, air_conditioner:true,
    fuel_capacity:"37L", transmission:"Automatic", capacity:5, price:900000,
    rating:4.3,
    description:"5-star Global NCAP rating. 1.2L turbo, 110 hp. Arcade.ev touchscreen, air purifier, cooled glovebox.",
    wikiMain:"Tata Altroz", wikiSide:"Tata Nexon", wikiRear:"Tata Motors",
    _dealer:2,
  },
];

// ─── Dealer credentials ───────────────────────────────────────────────
const DEALERS = [
  { email:"dealer1@carmax.com", user_name:"SpeedKings_Motors", password:"dealer123", location:"Mumbai, Maharashtra", phone:9876543210 },
  { email:"dealer2@carmax.com", user_name:"PremiumWheels",      password:"dealer123", location:"Delhi, NCR",          phone:9876543211 },
  { email:"dealer3@carmax.com", user_name:"AutoElite",           password:"dealer123", location:"Bangalore, Karnataka", phone:9876543212 },
];

// ─── Buyer credentials ────────────────────────────────────────────────
const BUYERS = [
  { email:"buyer1@carmax.com", user_name:"Rahul_Sharma", password:"buyer123" },
  { email:"buyer2@carmax.com", user_name:"Priya_Mehta",  password:"buyer123" },
  { email:"buyer@gmail.com",   user_name:"DemoBuyer",    password:"buyer123" },
];

// ─── Seed ─────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB\n");

  // Wipe previous demo data
  const demoEmails = [...DEALERS.map((d) => d.email), ...BUYERS.map((b) => b.email), "dealer@gmail.com"];
  const prevDealers = await Dealer.find({ email: { $in: demoEmails } });
  await Car.deleteMany({ dealer_id: { $in: prevDealers.map((d) => d._id) } });
  await Dealer.deleteMany({ email: { $in: demoEmails } });
  await Buyer.deleteMany({ email: { $in: demoEmails } });
  console.log("🗑   Cleared previous seed data\n");

  // Create dealers
  const createdDealers = [];
  for (const d of DEALERS) {
    const dealer = new Dealer(d);
    await dealer.save();
    createdDealers.push(dealer);
    console.log(`  👤  Dealer: ${d.user_name}  (${d.email})`);
  }
  // Legacy dealer account
  const legacyDealer = new Dealer({ email:"dealer@gmail.com", user_name:"DemoDealer", password:"dealer123" });
  await legacyDealer.save();
  console.log(`  👤  Dealer: DemoDealer  (dealer@gmail.com)\n`);

  // Create buyers
  for (const b of BUYERS) {
    const buyer = new Buyer(b);
    await buyer.save();
    console.log(`  🛒  Buyer: ${b.user_name}  (${b.email})`);
  }
  console.log();

  // Fetch images and create cars
  console.log("📷  Fetching real car images from Wikipedia…\n");
  let carCount = 0;

  for (const def of CAR_DEFS) {
    process.stdout.write(`  🚗  ${def.name.padEnd(26)}`);

    const [mainImg, sideImg, rearImg] = await Promise.all([
      getWikiImage(def.wikiMain),
      getWikiImageAlt(def.wikiSide),
      getWikiImageAlt(def.wikiRear),
    ]);

    const fallback = TYPE_FALLBACKS[def.type];
    const mainUrl     = mainImg  || fallback;
    const secondaryUrl = sideImg || mainImg  || fallback;
    const tertiaryUrl  = rearImg || mainImg  || fallback;

    process.stdout.write(mainImg ? "✓ image\n" : "⚠ fallback\n");

    const { _dealer, wikiMain, wikiSide, wikiRear, ...carData } = def;
    const dealer = createdDealers[_dealer];

    const car = new Car({
      ...carData,
      dealer_id: dealer._id,
      image: {
        main:      { fileId: `wiki-main-${carCount}`,      url: mainUrl },
        secondary: { fileId: `wiki-secondary-${carCount}`, url: secondaryUrl },
        tertiary:  { fileId: `wiki-tertiary-${carCount}`,  url: tertiaryUrl },
      },
    });

    await car.save();
    await Dealer.findByIdAndUpdate(dealer._id, { $push: { cars: car._id } });
    carCount++;
  }

  // Print credentials summary
  console.log("\n" + "═".repeat(62));
  console.log("✅  SEED COMPLETE — " + carCount + " cars across 6 types");
  console.log("═".repeat(62));

  console.log("\n📋  DEALER ACCOUNTS  (Login at /login-dealer)");
  console.log("─".repeat(62));
  DEALERS.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.user_name.padEnd(22)} ${d.email.padEnd(26)} dealer123`);
  });
  console.log(`  4. ${"DemoDealer".padEnd(22)} ${"dealer@gmail.com".padEnd(26)} dealer123`);

  console.log("\n📋  BUYER ACCOUNTS   (Login at /sign-in)");
  console.log("─".repeat(62));
  BUYERS.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.user_name.padEnd(22)} ${b.email.padEnd(26)} buyer123`);
  });

  console.log("\n" + "═".repeat(62));
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});

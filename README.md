# CarDealership — Full Stack Web App

A production-grade car dealership platform where dealers can list cars and buyers can browse, bargain, and purchase them in real time.

---

## Ports

| Service  | Port | URL |
|----------|------|-----|
| Backend  (Node.js / Express) | **5002** | http://localhost:5002 |
| Frontend (React / Vite)      | **5174** | http://localhost:5174 |
| MongoDB                      | **27017** | mongodb://127.0.0.1:27017/cars |

---

## Requirements

### System
| Tool | Minimum Version |
|------|----------------|
| Node.js | v18+ |
| npm | v9+ |
| MongoDB | v6+ (running locally) |

### Install MongoDB (macOS)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Install MongoDB (Ubuntu / Debian)
```bash
sudo apt install -y mongodb
sudo systemctl start mongodb
```

---

## Project Structure

```
CarDealership/
├── backend/          # Node.js + Express API
│   ├── app.js        # Entry point
│   ├── seed.js       # Database seeder (demo data)
│   ├── .env          # Environment variables
│   ├── Config/
│   ├── Controller/
│   ├── Middleware/
│   ├── Models/
│   ├── Routes/
│   └── Utils/
└── frontend/         # React + Vite app
    ├── src/
    ├── .env          # Frontend env vars
    └── vite.config.js
```

---

## Setup & Run

### Step 1 — Clone / open the project
```bash
cd "CarDealership"
```

### Step 2 — Backend setup
```bash
cd backend

# Install dependencies
npm install

# Copy env file (edit if needed)
cp .env.example .env

# Start the backend
npm run dev          # development (nodemon, auto-reload)
# OR
npm start            # production
```

Backend will start at **http://localhost:5002**

### Step 3 — Frontend setup
```bash
cd frontend

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Start the frontend
npm run dev
```

Frontend will open at **http://localhost:5174**

### Step 4 — Seed demo data (first time only)
```bash
cd backend
node seed.js
```

This creates:
- 3 dealer accounts + 22 cars (all types with real images)
- 3 buyer accounts
- See credentials below

---

## Demo Accounts

### Dealers — Login at http://localhost:5174/login-dealer

| Dealer Name | Email | Password |
|-------------|-------|----------|
| SpeedKings_Motors | dealer1@carmax.com | dealer123 |
| PremiumWheels | dealer2@carmax.com | dealer123 |
| AutoElite | dealer3@carmax.com | dealer123 |
| DemoDealer (legacy) | dealer@gmail.com | dealer123 |

### Buyers — Login at http://localhost:5174/sign-in

| Name | Email | Password |
|------|-------|----------|
| Rahul_Sharma | buyer1@carmax.com | buyer123 |
| Priya_Mehta | buyer2@carmax.com | buyer123 |
| DemoBuyer | buyer@gmail.com | buyer123 |

> The sign-in page has a **"Try Demo Account"** button that fills credentials automatically.

---

## Environment Variables

### backend/.env
```
PORT=5002
BASE_URL=http://localhost:5002
MONGO_URI=mongodb://127.0.0.1:27017/cars

JWT_SECRET=mysecretkey123
ACCESS_TOKEN_SECRET=mysecretkey123
REFRESH_TOKEN_SECRET=mysecretkey123
USER_TYPE_TOKEN_SECRET=mysecretkey123

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Optional — leave blank to use local disk storage for images
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

### frontend/.env
```
VITE_API_URL=http://localhost:5002
VITE_RAZORPAY_KEY=rzp_test_your_key_id
```

---

## Features

### Buyer
- Browse all cars with search, filter (type, capacity, price range), and sort
- View car details with image gallery
- Add/remove from watchlist
- Chat and bargain with dealers in real time (Socket.IO)
- Buy cars via Razorpay payment gateway

### Dealer
- Register / login with dedicated dealer portal
- Add, edit, and delete cars (with image upload)
- Manage bargain offers (accept / reject)
- View deal history
- Real-time chat notifications

### General
- JWT authentication (access + refresh tokens)
- Role-based access (Buyer / Dealer)
- Fully responsive (mobile, tablet, desktop)
- Rate limiting, security headers (Helmet), gzip compression

---

## Available Scripts

### Backend
```bash
npm run dev     # Start with nodemon (auto-reload)
npm start       # Start with node
node seed.js    # Seed demo data
```

### Frontend
```bash
npm run dev     # Start Vite dev server (port 5174)
npm run build   # Production build → dist/
npm run preview # Preview production build
npm run lint    # Run ESLint
```

---

## Troubleshooting

**Port already in use**
```bash
# Find what's using a port
lsof -i :5002
lsof -i :5174
# Kill it
kill -9 <PID>
```

**MongoDB not connecting**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**bcrypt build error on Apple Silicon**
```bash
cd backend
npm rebuild bcrypt
```

**Rollup / Vite native module error**
```bash
cd frontend
npm install @rollup/rollup-darwin-arm64 --save-optional
```

**Images not loading**
- Car images are fetched from Wikipedia Commons — requires internet access
- If offline, a type-based fallback image is shown automatically

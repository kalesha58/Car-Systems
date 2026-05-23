# Car Connect Backend

Backend API server for the Car Connect application built with Node.js, Express, TypeScript, and MongoDB.

## Prerequisites

- Node.js >= 20
- MongoDB (local or remote instance)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB connection string
   - Adjust `PORT` if needed (default: 3000)

3. Start MongoDB (if running locally):
```bash
# Make sure MongoDB is running on your system
```

## Development

Run the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Build

Build the TypeScript project:
```bash
npm run build
```

## Production

Start the production server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Returns server status and timestamp

### Admin APIs
All admin APIs are prefixed with `/admin` and require authentication with admin role.

**📖 [Complete Admin API Documentation](./docs/ADMIN_API_ROUTES.md)**

Quick reference:
- Dashboard: `/admin/dashboard/*`
- Users: `/admin/users/*`
- Dealers: `/admin/dealers/*`
- Products: `/admin/products/*`
- Categories: `/admin/categories/*`
- Orders: `/admin/orders/*`
- Reports: `/admin/reports/*`
- Settings: `/admin/settings/*`

### Public APIs
- Authentication: `/api/auth/*`
- Vehicles: `/api/vehicles/*`
- Posts: `/api/posts/*`
- Upload: `/api/upload/*`
- Dealers: `/api/dealers/*`
- Services: `/api/services/*`

### User APIs (Authenticated)
- Profile: `/api/profile/*`
  **📖 [Profile API Documentation](./docs/PROFILE_API.md)**

## Project Structure

```
backend/
├── src/
│   ├── config/            # Configuration files
│   │   ├── database.ts    # MongoDB connection
│   │   └── cloudinary.ts  # Cloudinary configuration
│   ├── controllers/       # Request handlers
│   │   ├── admin/         # Admin controllers
│   │   └── ...
│   ├── middleware/        # Express middleware
│   │   ├── authMiddleware.ts
│   │   └── adminMiddleware.ts
│   ├── models/            # Mongoose models
│   ├── routes/            # Route definitions
│   │   ├── admin/         # Admin routes
│   │   └── ...
│   ├── services/          # Business logic
│   │   ├── admin/         # Admin services
│   │   └── ...
│   ├── types/             # TypeScript interfaces
│   ├── utils/             # Utility functions
│   └── index.ts           # Main server entry point
├── docs/                  # Documentation
│   ├── ADMIN_API_ROUTES.md
│   └── PROFILE_API.md
├── dist/                  # Compiled JavaScript (generated)
├── .env                   # Environment variables (not in git)
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (required)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `JWT_EXPIRES_IN` - JWT token expiration (default: 30d)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (for file uploads)
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `GREETING_NOTIFICATION_IMAGE_URL` - HTTPS URL for login greeting push image (Motonode logo). Run `npm run upload:greeting-logo` once, then set this on Vercel.
- `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to Firebase Admin service account JSON (e.g. `motonode-admin.json` in the `server/` folder). Alternative: `FIREBASE_SERVICE_ACCOUNT_JSON` with the full JSON string.

### Razorpay (UPI / online checkout)

Use keys from the [Razorpay Dashboard](https://dashboard.razorpay.com/) (test: `rzp_test_...`, live: `rzp_live_...`):

- `RAZORPAY_KEY_ID` - Public key (sent to mobile app for checkout)
- `RAZORPAY_KEY_SECRET` - Secret key (server only)
- `RAZORPAY_WEBHOOK_SECRET` - Must match **Secret** in Dashboard → Webhooks (e.g. `mymotonode123`)
- `RAZORPAY_ENV` - Optional label (`test` / `live`)
- `COD_CHARGE` - COD fee in rupees (default: `5`)
- `PAYMENT_TIMEOUT_MINUTES` - UPI order expiry (default: `15`)

**Webhook (production):** `https://api.motonode.in/api/webhooks/razorpay`  
Implemented in `src/index.ts` (raw body + `x-razorpay-signature` verification).

**Pre-deploy check:** `npm run verify:razorpay` — validates env vars locally.  
**Retry checkout:** `POST /api/user/orders/:id/payment-action` — returns `RAZORPAY_CHECKOUT` for pending UPI orders (regenerates Razorpay order if the stored id is a legacy Mongo/Cashfree id).

See [`RAZORPAY_WEBHOOK.md`](./RAZORPAY_WEBHOOK.md) for dashboard webhook steps.

In Razorpay Dashboard → **Settings → Webhooks**, enable under **Payment events**:

- `payment.captured`
- `payment.failed`
- `order.paid` (recommended)

Mobile app API base must be the same host: `https://api.motonode.in/api` (`client/src/service/config.tsx`).

### Store categories and seeding

Canonical category names and tile groups live in **`src/data/storeCategories.ts`** (see also [`docs/STORE_CATEGORIES.md`](./docs/STORE_CATEGORIES.md)).

| Script | npm command |
|--------|-------------|
| Category tiles + Spare Parts | `npm run seed:categories` |
| Legacy name → canonical migration | `npm run seed:migrate-categories` |
| Demo services + products + CDN tile images | `SEED_DEALER_USER_ID=... npm run seed:all-inventory` |
| Premium dealer product samples | `SEED_DEALER_USER_ID=... npm run seed:dealer-products` |
| Older sample products (no hardcoded ObjectIds) | `npm run seed:products` |

**New environment:**

```bash
cd server
npm run seed:categories
SEED_DEALER_USER_ID='<your_dealer_user_object_id>' npm run seed:all-inventory
```

**Existing DB** with legacy category names (`Car Care`, `Tyres & Wheels`, etc.): run `npm run seed:migrate-categories` once to repoint `Product.categoryId` and deactivate old category documents.

`seed:all-inventory` upserts Store home tiles (with `imageUrl` / `tileGroup`), upserts **Spare Parts**, deletes that dealer’s existing **services** and **products**, then inserts the bundled demo catalog. Service subcategories remain in `serviceCategoryConfig.ts`—not on `Category` documents.


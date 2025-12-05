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






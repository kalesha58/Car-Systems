# Profile API Documentation

## Overview

The Profile API allows authenticated users to view and update their profile information, including profile images. The API supports image uploads from gallery or camera, which are stored in Cloudinary.

## Base URL

```
http://localhost:3000/api/profile
```

For production, replace with your production URL.

## Authentication

All endpoints require authentication via JWT Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

To get a token, first login using the `/api/auth/login` endpoint.

---

## Endpoints

### 1. Get User Profile

Retrieve the current authenticated user's profile information.

**Endpoint:** `GET /api/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "Response": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": ["user"],
    "profileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/car-connect/profiles/profile.jpg"
  }
}
```

**cURL Command:**
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Error Responses:**

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "Response": {
    "ReturnMessage": "Unauthorized"
  }
}
```

---

### 2. Update User Profile

Update user profile information including name, phone, and/or profile image.

**Endpoint:** `PUT /api/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | User's full name |
| `phone` | string | No | User's phone number (10 digits) |
| `image` | file | No | Profile image (JPEG, PNG, etc.) |

**Note:** You can update any combination of fields. Only include the fields you want to update.

**Response (200 OK):**
```json
{
  "success": true,
  "Response": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe Updated",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": ["user"],
    "profileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/car-connect/profiles/new-profile.jpg"
  }
}
```

**cURL Commands:**

#### Update Name Only
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=John Doe Updated"
```

#### Update Phone Only
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "phone=9876543210"
```

#### Update Profile Image Only
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

#### Update Name and Phone
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=John Doe Updated" \
  -F "phone=9876543210"
```

#### Update All Fields (Name, Phone, and Image)
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=John Doe Updated" \
  -F "phone=9876543210" \
  -F "image=@/path/to/your/image.jpg"
```

**Error Responses:**

- **400 Bad Request** - Invalid phone number format:
```json
{
  "success": false,
  "Response": {
    "ReturnMessage": "Phone number must be exactly 10 digits"
  }
}
```

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "Response": {
    "ReturnMessage": "Unauthorized"
  }
}
```

- **409 Conflict** - Phone number already in use:
```json
{
  "success": false,
  "Response": {
    "ReturnMessage": "Phone number already in use"
  }
}
```

- **500 Internal Server Error** - Image upload failed:
```json
{
  "success": false,
  "Response": {
    "ReturnMessage": "Failed to upload profile image"
  }
}
```

---

## How It Works

### Architecture Flow

```
Client Request
    ↓
Authentication Middleware (JWT Verification)
    ↓
Upload Middleware (Multer - File Handling)
    ↓
Profile Controller
    ↓
Profile Service (Business Logic)
    ↓
Database (MongoDB) / Cloudinary (Image Storage)
    ↓
Response to Client
```

### Detailed Process

#### 1. **Get Profile Flow**

1. Client sends GET request with JWT token
2. `authMiddleware` verifies the token and extracts user information
3. `getProfileController` retrieves user ID from `req.user`
4. `getUserProfile` service function fetches user data from MongoDB
5. Returns user profile including profile image URL

#### 2. **Update Profile Flow**

1. Client sends PUT request with JWT token and form data
2. `authMiddleware` verifies the token
3. `uploadSingle` middleware (Multer) processes the image file:
   - **Local Development**: Saves to disk temporarily
   - **Serverless (Vercel)**: Uses memory buffer
4. `updateProfileController` processes the request:
   - Extracts text fields (name, phone) from form data
   - If image is provided:
     - Uploads to Cloudinary in `car-connect/profiles` folder
     - Gets back the image URL
     - Deletes old profile image from Cloudinary (if exists)
     - Deletes local temporary file
5. `updateUserProfile` service function:
   - Validates phone number format (10 digits)
   - Checks phone number uniqueness
   - Updates user document in MongoDB
6. Returns updated profile

### Image Upload Process

1. **File Reception**: Multer receives the file
   - Local: Saves to `backend/uploads/` directory
   - Serverless: Stores in memory buffer

2. **Cloudinary Upload**:
   - File is uploaded to Cloudinary
   - Stored in `car-connect/profiles` folder
   - Returns secure URL and public ID

3. **Old Image Cleanup**:
   - Extracts public ID from old image URL
   - Deletes old image from Cloudinary
   - Prevents storage bloat

4. **Local File Cleanup**:
   - Deletes temporary file from disk (local only)
   - Cleans up on errors as well

### Database Schema

The user profile is stored in the `SignUp` collection with the following relevant fields:

```typescript
{
  name: string,           // User's full name
  email: string,          // User's email (unique, immutable)
  phone: string,          // User's phone (unique, 10 digits)
  role: string[],         // User roles ['user', 'admin', 'dealer']
  profileImage?: string,  // Cloudinary URL for profile image
  // ... other fields
}
```

---

## Testing Examples

### Complete Workflow Example

#### Step 1: Login to Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "Response": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": ["user"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 2: Get Current Profile
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### Step 3: Update Profile with Image
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "name=John Doe Updated" \
  -F "phone=9876543210" \
  -F "image=@./profile-photo.jpg"
```

---

## React Native Integration Example

### Using Fetch API

```typescript
// Update profile with image
const updateProfile = async (name: string, phone: string, imageUri: string | null) => {
  const token = await AsyncStorage.getItem('@auth_token');
  
  const formData = new FormData();
  formData.append('name', name);
  formData.append('phone', phone);
  
  if (imageUri) {
    formData.append('image', {
      uri: imageUri, // From gallery or camera
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Profile updated:', data.Response);
      return data.Response;
    } else {
      throw new Error(data.Response?.ReturnMessage || 'Update failed');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
```

### Using Axios

```typescript
import axios from 'axios';

const updateProfile = async (name: string, phone: string, imageUri: string | null) => {
  const token = await AsyncStorage.getItem('@auth_token');
  
  const formData = new FormData();
  formData.append('name', name);
  formData.append('phone', phone);
  
  if (imageUri) {
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
  }

  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/profile`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.Response;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
```

---

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/car-connect

# Server Configuration
PORT=3000
NODE_ENV=development
```

---

## File Size Limits

- **Maximum image size**: 5MB
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Recommended dimensions**: 400x400px to 2000x2000px

---

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "Response": {
    "ReturnMessage": "Error message here"
  }
}
```

Common error scenarios:
- **401**: Token missing, invalid, or expired
- **400**: Validation errors (invalid phone format, etc.)
- **409**: Conflict (phone already in use)
- **404**: User not found
- **500**: Server errors (Cloudinary upload failure, database errors)

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only update their own profile
3. **File Validation**: Only image files are accepted
4. **File Size**: 5MB limit prevents abuse
5. **Phone Validation**: 10-digit format enforced
6. **Phone Uniqueness**: Prevents duplicate phone numbers

---

## Notes

- Profile images are stored in Cloudinary, not in the database
- Only the image URL is stored in MongoDB
- Old profile images are automatically deleted when updating
- Email cannot be changed through this endpoint (immutable)
- The API supports partial updates (update only what you send)

---

## Support

For issues or questions, please check:
- API Documentation: `/api-docs` (Swagger UI)
- Health Check: `/health`
- Base API Info: `/`




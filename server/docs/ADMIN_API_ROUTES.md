# Admin API Routes Documentation

## Base URL
```
http://localhost:5000/admin
```

## Authentication
All admin endpoints require:
1. **Authentication Token** in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```
2. **Admin Role** - User must have `admin` role

---

## Table of Contents
1. [Dashboard APIs](#1-dashboard-apis)
2. [User Management APIs](#2-user-management-apis)
3. [Dealer Management APIs](#3-dealer-management-apis)
4. [Product Management APIs](#4-product-management-apis)
5. [Category Management APIs](#5-category-management-apis)
6. [Order Management APIs](#6-order-management-apis)
7. [Reports APIs](#7-reports-apis)
8. [Settings APIs](#8-settings-apis)

---

## 1. Dashboard APIs

### Get Dashboard Statistics
- **GET** `/admin/dashboard/stats`
- **Description**: Get overall dashboard statistics including totals and growth metrics
- **Response**:
```json
{
  "totalUsers": 150,
  "totalDealers": 25,
  "totalOrders": 500,
  "totalProducts": 200,
  "revenue": 125000.50,
  "growth": {
    "users": 15.5,
    "dealers": 8.2,
    "orders": 22.3,
    "revenue": 18.7
  }
}
```

### Get Users Chart Data
- **GET** `/admin/dashboard/charts/users?startDate=2024-01-01&endDate=2024-12-31`
- **Description**: Get user registration data for charts
- **Query Parameters**:
  - `startDate` (optional): Start date (ISO format)
  - `endDate` (optional): End date (ISO format)
- **Response**:
```json
[
  {
    "month": "2024-01",
    "users": 45
  },
  {
    "month": "2024-02",
    "users": 52
  }
]
```

### Get Orders Chart Data
- **GET** `/admin/dashboard/charts/orders?startDate=2024-01-01&endDate=2024-12-31`
- **Description**: Get order data for charts
- **Query Parameters**:
  - `startDate` (optional): Start date (ISO format)
  - `endDate` (optional): End date (ISO format)
- **Response**:
```json
[
  {
    "month": "2024-01",
    "orders": 120
  },
  {
    "month": "2024-02",
    "orders": 135
  }
]
```

### Get Order Status Distribution
- **GET** `/admin/dashboard/charts/order-status`
- **Description**: Get distribution of orders by status
- **Response**:
```json
[
  {
    "status": "pending",
    "count": 25
  },
  {
    "status": "delivered",
    "count": 150
  }
]
```

---

## 2. User Management APIs

### Get All Users
- **GET** `/admin/users?page=1&limit=10&search=john&status=active&sortBy=createdAt&sortOrder=desc`
- **Description**: Get paginated list of users with filters
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 10): Items per page
  - `search` (optional): Search by name, email, or phone
  - `status` (optional): Filter by status
  - `sortBy` (optional, default: createdAt): Field to sort by
  - `sortOrder` (optional, default: desc): Sort order (asc/desc)
- **Response**:
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### Get User by ID
- **GET** `/admin/users/:id`
- **Description**: Get detailed user information including orders and vehicles
- **Response**:
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "status": "active",
  "addresses": [],
  "orders": [...],
  "vehicles": [...],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Create User
- **POST** `/admin/users`
- **Description**: Create a new user
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "securePassword123"
}
```
- **Response**:
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Update User
- **PUT** `/admin/users/:id`
- **Description**: Update user information
- **Request Body**:
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "status": "active"
}
```
- **Response**: Updated user object

### Delete User
- **DELETE** `/admin/users/:id`
- **Description**: Delete a user
- **Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Update User Status
- **PATCH** `/admin/users/:id/status`
- **Description**: Block or unblock a user
- **Request Body**:
```json
{
  "status": "blocked"
}
```
- **Response**: Updated user object

### Reset User Password
- **POST** `/admin/users/:id/reset-password`
- **Description**: Reset user password
- **Request Body**:
```json
{
  "newPassword": "newSecurePassword123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Get User Orders
- **GET** `/admin/users/:id/orders?page=1&limit=10`
- **Description**: Get all orders for a specific user
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
- **Response**:
```json
{
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Get User Vehicles
- **GET** `/admin/users/:id/vehicles`
- **Description**: Get all vehicles owned by a user
- **Response**:
```json
{
  "vehicles": [
    {
      "id": "vehicle_id",
      "brand": "Toyota",
      "model": "Camry",
      "numberPlate": "ABC123",
      ...
    }
  ]
}
```

---

## 3. Dealer Management APIs

### Get All Dealers
- **GET** `/admin/dealers?page=1&limit=10&search=auto&status=approved&location=NYC&sortBy=createdAt&sortOrder=desc`
- **Description**: Get paginated list of dealers with filters
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
  - `search` (optional): Search by name, business name, or email
  - `status` (optional): Filter by status (pending/approved/rejected/suspended)
  - `location` (optional): Filter by location
  - `sortBy` (optional, default: createdAt)
  - `sortOrder` (optional, default: desc)
- **Response**:
```json
{
  "dealers": [
    {
      "id": "dealer_id",
      "name": "John Dealer",
      "businessName": "Auto World",
      "email": "dealer@example.com",
      "phone": "1234567890",
      "status": "approved",
      "location": "New York",
      "address": "123 Main St",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {...}
}
```

### Get Dealer by ID
- **GET** `/admin/dealers/:id`
- **Description**: Get detailed dealer information including orders
- **Response**: Dealer object with orders array

### Create Dealer
- **POST** `/admin/dealers`
- **Description**: Create a new dealer
- **Request Body**:
```json
{
  "name": "John Dealer",
  "businessName": "Auto World",
  "email": "dealer@example.com",
  "phone": "1234567890",
  "location": "New York",
  "address": "123 Main St"
}
```
- **Response**: Created dealer object (status: pending)

### Update Dealer
- **PUT** `/admin/dealers/:id`
- **Description**: Update dealer information
- **Request Body**:
```json
{
  "name": "John Updated",
  "businessName": "Auto World Updated",
  "phone": "9876543210",
  "location": "Los Angeles"
}
```
- **Response**: Updated dealer object

### Delete Dealer
- **DELETE** `/admin/dealers/:id`
- **Description**: Delete a dealer
- **Response**:
```json
{
  "success": true,
  "message": "Dealer deleted successfully"
}
```

### Approve Dealer
- **POST** `/admin/dealers/:id/approve`
- **Description**: Approve a pending dealer
- **Response**: Updated dealer object (status: approved)

### Reject Dealer
- **POST** `/admin/dealers/:id/reject`
- **Description**: Reject a pending dealer
- **Request Body**:
```json
{
  "reason": "Incomplete documentation"
}
```
- **Response**: Updated dealer object (status: rejected)

### Suspend Dealer
- **POST** `/admin/dealers/:id/suspend`
- **Description**: Suspend an approved dealer
- **Request Body**:
```json
{
  "reason": "Violation of terms"
}
```
- **Response**: Updated dealer object (status: suspended)

### Get Dealer Orders
- **GET** `/admin/dealers/:id/orders?page=1&limit=10`
- **Description**: Get all orders for a specific dealer
- **Response**: Orders array with pagination

---

## 4. Product Management APIs

### Get All Products
- **GET** `/admin/products?page=1&limit=10&search=engine&category=parts&status=active&minPrice=10&maxPrice=1000&sortBy=price&sortOrder=asc`
- **Description**: Get paginated list of products with filters
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
  - `search` (optional): Search by name or description
  - `category` (optional): Filter by category name
  - `status` (optional): Filter by status (active/inactive/out_of_stock)
  - `minPrice` (optional): Minimum price filter
  - `maxPrice` (optional): Maximum price filter
  - `sortBy` (optional, default: createdAt)
  - `sortOrder` (optional, default: desc)
- **Response**:
```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Engine Oil",
      "category": "Parts",
      "price": 29.99,
      "stock": 100,
      "status": "active",
      "images": ["url1", "url2"],
      "description": "High quality engine oil",
      "tags": ["oil", "engine"],
      "specifications": {},
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {...}
}
```

### Get Product by ID
- **GET** `/admin/products/:id`
- **Description**: Get detailed product information
- **Response**: Product object

### Create Product
- **POST** `/admin/products`
- **Description**: Create a new product
- **Request Body**:
```json
{
  "name": "Engine Oil",
  "categoryId": "category_id",
  "price": 29.99,
  "stock": 100,
  "description": "High quality engine oil",
  "tags": ["oil", "engine"],
  "specifications": {
    "viscosity": "5W-30",
    "volume": "5L"
  }
}
```
- **Response**: Created product object

### Update Product
- **PUT** `/admin/products/:id`
- **Description**: Update product information
- **Request Body**:
```json
{
  "name": "Premium Engine Oil",
  "price": 34.99,
  "stock": 150,
  "status": "active",
  "description": "Updated description"
}
```
- **Response**: Updated product object

### Delete Product
- **DELETE** `/admin/products/:id`
- **Description**: Delete a product
- **Response**:
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Update Product Stock
- **PATCH** `/admin/products/:id/stock`
- **Description**: Update product stock quantity
- **Request Body**:
```json
{
  "stock": 200,
  "operation": "set"
}
```
- **Operations**: `set`, `add`, `subtract`
- **Response**: Updated product object

---

## 5. Category Management APIs

### Get All Categories
- **GET** `/admin/categories?search=parts&status=active`
- **Description**: Get all categories with optional filters
- **Query Parameters**:
  - `search` (optional): Search by name or description
  - `status` (optional): Filter by status (active/inactive)
- **Response**:
```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "Parts",
      "description": "Car parts and accessories",
      "status": "active",
      "products": 50,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Category by ID
- **GET** `/admin/categories/:id`
- **Description**: Get detailed category information
- **Response**: Category object

### Create Category
- **POST** `/admin/categories`
- **Description**: Create a new category
- **Request Body**:
```json
{
  "name": "Parts",
  "description": "Car parts and accessories",
  "status": "active"
}
```
- **Response**: Created category object

### Update Category
- **PUT** `/admin/categories/:id`
- **Description**: Update category information
- **Request Body**:
```json
{
  "name": "Auto Parts",
  "description": "Updated description",
  "status": "active"
}
```
- **Response**: Updated category object

### Delete Category
- **DELETE** `/admin/categories/:id`
- **Description**: Delete a category (only if no products exist)
- **Response**:
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## 6. Order Management APIs

### Get All Orders
- **GET** `/admin/orders?page=1&limit=10&search=ORD-123&status=pending&dealerId=dealer_id&userId=user_id&startDate=2024-01-01&endDate=2024-12-31&sortBy=createdAt&sortOrder=desc`
- **Description**: Get paginated list of orders with filters
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
  - `search` (optional): Search by order number
  - `status` (optional): Filter by status
  - `dealerId` (optional): Filter by dealer
  - `userId` (optional): Filter by user
  - `startDate` (optional): Start date filter
  - `endDate` (optional): End date filter
  - `sortBy` (optional, default: createdAt)
  - `sortOrder` (optional, default: desc)
- **Response**:
```json
{
  "orders": [
    {
      "id": "order_id",
      "orderNumber": "ORD-123456789",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "dealer": {
        "id": "dealer_id",
        "name": "Auto World",
        "businessName": "Auto World Inc"
      },
      "items": [...],
      "subtotal": 100.00,
      "tax": 10.00,
      "shipping": 5.00,
      "totalAmount": 115.00,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "credit_card",
      "shippingAddress": {...},
      "billingAddress": {...},
      "tracking": {...},
      "timeline": [...],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {...}
}
```

### Get Order by ID
- **GET** `/admin/orders/:id`
- **Description**: Get detailed order information
- **Response**: Complete order object

### Create Order
- **POST** `/admin/orders`
- **Description**: Create a new order
- **Request Body**:
```json
{
  "userId": "user_id",
  "dealerId": "dealer_id",
  "items": [
    {
      "productId": "product_id",
      "name": "Engine Oil",
      "quantity": 2,
      "price": 29.99,
      "total": 59.98
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}
```
- **Response**: Created order object

### Update Order Status
- **PATCH** `/admin/orders/:id/status`
- **Description**: Update order status
- **Request Body**:
```json
{
  "status": "shipped",
  "notes": "Order shipped via FedEx"
}
```
- **Response**: Updated order object

### Cancel Order
- **POST** `/admin/orders/:id/cancel`
- **Description**: Cancel an order
- **Request Body**:
```json
{
  "reason": "Customer requested cancellation"
}
```
- **Response**: Updated order object (status: cancelled)

### Assign Dealer to Order
- **POST** `/admin/orders/:id/assign-dealer`
- **Description**: Assign a dealer to an order
- **Request Body**:
```json
{
  "dealerId": "dealer_id"
}
```
- **Response**: Updated order object

### Add Tracking Information
- **POST** `/admin/orders/:id/tracking`
- **Description**: Add tracking information to an order
- **Request Body**:
```json
{
  "trackingNumber": "TRACK123456",
  "carrier": "FedEx",
  "status": "In Transit",
  "estimatedDelivery": "2024-01-20T10:00:00Z"
}
```
- **Response**:
```json
{
  "tracking": {
    "trackingNumber": "TRACK123456",
    "carrier": "FedEx",
    "status": "In Transit",
    "estimatedDelivery": "2024-01-20T10:00:00Z"
  }
}
```

### Get Order Timeline
- **GET** `/admin/orders/:id/timeline`
- **Description**: Get order status timeline
- **Response**:
```json
{
  "timeline": [
    {
      "status": "pending",
      "timestamp": "2024-01-15T10:30:00Z",
      "notes": "Order created"
    },
    {
      "status": "confirmed",
      "timestamp": "2024-01-15T11:00:00Z",
      "notes": "Order confirmed"
    }
  ]
}
```

---

## 7. Reports APIs

### Get Sales Report
- **GET** `/admin/reports/sales?startDate=2024-01-01&endDate=2024-12-31&groupBy=month&dealerId=dealer_id`
- **Description**: Get sales report with aggregation
- **Query Parameters**:
  - `startDate` (optional): Start date
  - `endDate` (optional): End date
  - `groupBy` (optional): Group by day/month/year (default: day)
  - `dealerId` (optional): Filter by dealer
- **Response**:
```json
{
  "totalSales": 125000.50,
  "totalOrders": 500,
  "data": [
    {
      "period": "2024-01",
      "totalSales": 10000.00,
      "totalOrders": 40
    }
  ]
}
```

### Get Users Report
- **GET** `/admin/reports/users?startDate=2024-01-01&endDate=2024-12-31&groupBy=month`
- **Description**: Get users report
- **Query Parameters**:
  - `startDate` (optional)
  - `endDate` (optional)
  - `groupBy` (optional): day/month/year
- **Response**:
```json
{
  "totalUsers": 150,
  "newUsers": 50,
  "activeUsers": 120,
  "data": [
    {
      "period": "2024-01",
      "users": 45
    }
  ]
}
```

### Get Products Report
- **GET** `/admin/reports/products?startDate=2024-01-01&endDate=2024-12-31&categoryId=category_id`
- **Description**: Get products report including top products and low stock
- **Query Parameters**:
  - `startDate` (optional)
  - `endDate` (optional)
  - `categoryId` (optional)
- **Response**:
```json
{
  "topProducts": [
    {
      "productId": "product_id",
      "name": "Engine Oil",
      "totalSold": 500,
      "totalRevenue": 14995.00
    }
  ],
  "lowStock": [
    {
      "id": "product_id",
      "name": "Brake Pads",
      "stock": 5
    }
  ],
  "data": [...]
}
```

### Export Report
- **GET** `/admin/reports/export?type=sales&format=excel&startDate=2024-01-01&endDate=2024-12-31`
- **Description**: Export report as Excel or PDF
- **Query Parameters**:
  - `type`: Report type (sales/users/products)
  - `format`: Export format (excel/pdf)
  - `startDate` (optional)
  - `endDate` (optional)
- **Response**: File download
- **Status**: Not yet implemented (returns 501)

---

## 8. Settings APIs

### Get Settings
- **GET** `/admin/settings`
- **Description**: Get application settings
- **Response**:
```json
{
  "siteName": "Car Connect",
  "siteEmail": "admin@carconnect.com",
  "currency": "USD",
  "taxRate": 10,
  "shippingCost": 5.00
}
```

### Update Settings
- **PUT** `/admin/settings`
- **Description**: Update application settings
- **Request Body**:
```json
{
  "siteName": "Car Connect Pro",
  "siteEmail": "support@carconnect.com",
  "currency": "USD",
  "taxRate": 12,
  "shippingCost": 7.50
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "siteName": "Car Connect Pro",
    "siteEmail": "support@carconnect.com",
    "currency": "USD",
    "taxRate": 12,
    "shippingCost": 7.50
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "Response": {
    "ReturnMessage": "Error message here"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not an admin)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `422` - Validation Error
- `500` - Internal Server Error

---

## Notes

- All dates should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- Pagination defaults: `page=1`, `limit=10`
- All admin routes require authentication token and admin role
- Search is case-insensitive
- Sort order can be `asc` or `desc` (default: `desc`)

---

## Example Usage

### Using cURL

```bash
# Get dashboard stats
curl -X GET http://localhost:5000/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create a new user
curl -X POST http://localhost:5000/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "securePassword123"
  }'

# Update product stock
curl -X PATCH http://localhost:5000/admin/products/PRODUCT_ID/stock \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 200,
    "operation": "add"
  }'
```

### Using JavaScript/Fetch

```javascript
// Get all users
const response = await fetch('http://localhost:5000/admin/users?page=1&limit=10', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

---

## Support

For issues or questions, please contact the development team.


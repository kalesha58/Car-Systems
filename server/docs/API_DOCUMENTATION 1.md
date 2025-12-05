# Car Connect Admin Panel - API Documentation

## Base URL
```
https://api.carconnect.com/v1
```

## Authentication
All protected endpoints require an Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication APIs

### Login
- **POST** `/auth/login`
- **Body:** `{ email, password, rememberMe }`
- **Response:** `{ token, user }`

### Forgot Password
- **POST** `/auth/forgot-password`
- **Body:** `{ email }`
- **Response:** `{ success, message }`

### Reset Password
- **POST** `/auth/reset-password`
- **Body:** `{ token, password, confirmPassword }`
- **Response:** `{ success, message }`

### Logout
- **POST** `/auth/logout`
- **Response:** `{ success, message }`

### Refresh Token
- **POST** `/auth/refresh-token`
- **Body:** `{ refreshToken }`
- **Response:** `{ token, refreshToken }`

---

## 2. Dashboard APIs

### Get Dashboard Statistics
- **GET** `/dashboard/stats`
- **Response:** `{ totalUsers, totalDealers, totalOrders, totalProducts, revenue, growth }`

### Get Users Chart Data
- **GET** `/dashboard/charts/users?startDate&endDate`
- **Response:** `[{ month, users }]`

### Get Orders Chart Data
- **GET** `/dashboard/charts/orders?startDate&endDate`
- **Response:** `[{ month, orders }]`

### Get Order Status Distribution
- **GET** `/dashboard/charts/order-status`
- **Response:** `[{ status, count }]`

---

## 3. User Management APIs

### Get All Users
- **GET** `/users?page&limit&search&status&sortBy&sortOrder`
- **Response:** `{ users[], pagination }`

### Get User by ID
- **GET** `/users/:id`
- **Response:** `{ id, name, email, phone, status, addresses, orders, vehicles, createdAt }`

### Create User
- **POST** `/users`
- **Body:** `{ name, email, phone, password }`
- **Response:** `{ id, name, email, phone, status, createdAt }`

### Update User
- **PUT** `/users/:id`
- **Body:** `{ name, phone, status }`
- **Response:** `{ id, name, email, phone, status, updatedAt }`

### Delete User
- **DELETE** `/users/:id`
- **Response:** `{ success, message }`

### Block/Unblock User
- **PATCH** `/users/:id/status`
- **Body:** `{ status }`
- **Response:** `{ id, status, updatedAt }`

### Reset User Password
- **POST** `/users/:id/reset-password`
- **Body:** `{ newPassword }`
- **Response:** `{ success, message }`

### Get User Orders
- **GET** `/users/:id/orders?page&limit`
- **Response:** `{ orders[], pagination }`

### Get User Vehicles
- **GET** `/users/:id/vehicles`
- **Response:** `{ vehicles[] }`

---

## 4. Dealer Management APIs

### Get All Dealers
- **GET** `/dealers?page&limit&search&status&location&sortBy&sortOrder`
- **Response:** `{ dealers[], pagination }`

### Get Dealer by ID
- **GET** `/dealers/:id`
- **Response:** `{ id, name, businessName, email, phone, status, location, address, documents, orders, reviews, createdAt }`

### Create Dealer
- **POST** `/dealers`
- **Body:** `{ name, businessName, email, phone, location, address }`
- **Response:** `{ id, name, businessName, email, phone, status, createdAt }`

### Update Dealer
- **PUT** `/dealers/:id`
- **Body:** `{ name, businessName, phone, location }`
- **Response:** `{ id, name, businessName, email, phone, status, updatedAt }`

### Delete Dealer
- **DELETE** `/dealers/:id`
- **Response:** `{ success, message }`

### Approve Dealer
- **POST** `/dealers/:id/approve`
- **Response:** `{ id, status: "approved", updatedAt }`

### Reject Dealer
- **POST** `/dealers/:id/reject`
- **Body:** `{ reason }`
- **Response:** `{ id, status: "rejected", rejectionReason, updatedAt }`

### Suspend Dealer
- **POST** `/dealers/:id/suspend`
- **Body:** `{ reason }`
- **Response:** `{ id, status: "suspended", suspensionReason, updatedAt }`

### Get Dealer Orders
- **GET** `/dealers/:id/orders?page&limit`
- **Response:** `{ orders[], pagination }`

### Upload Dealer Document
- **POST** `/dealers/:id/documents`
- **Body:** FormData `{ file, documentType }`
- **Response:** `{ document: { id, url, type, uploadedAt } }`

---

## 5. Product Catalogue APIs

### Get All Products
- **GET** `/products?page&limit&search&category&status&minPrice&maxPrice&sortBy&sortOrder`
- **Response:** `{ products[], pagination }`

### Get Product by ID
- **GET** `/products/:id`
- **Response:** `{ id, name, category, price, stock, status, images, description, tags, specifications, createdAt }`

### Create Product
- **POST** `/products`
- **Body:** `{ name, categoryId, price, stock, description, tags, specifications }` + FormData for images
- **Response:** `{ id, name, category, price, stock, status, createdAt }`

### Update Product
- **PUT** `/products/:id`
- **Body:** `{ name, price, stock, status, description }`
- **Response:** `{ id, name, price, stock, status, updatedAt }`

### Delete Product
- **DELETE** `/products/:id`
- **Response:** `{ success, message }`

### Upload Product Image
- **POST** `/products/:id/images`
- **Body:** FormData `{ file, isPrimary }`
- **Response:** `{ image: { id, url, isPrimary } }`

### Delete Product Image
- **DELETE** `/products/:id/images/:imageId`
- **Response:** `{ success, message }`

### Update Product Stock
- **PATCH** `/products/:id/stock`
- **Body:** `{ stock, operation: "set" | "add" | "subtract" }`
- **Response:** `{ id, stock, updatedAt }`

---

## 6. Categories APIs

### Get All Categories
- **GET** `/categories?search&status`
- **Response:** `{ categories[] }`

### Get Category by ID
- **GET** `/categories/:id`
- **Response:** `{ id, name, description, status, products, createdAt }`

### Create Category
- **POST** `/categories`
- **Body:** `{ name, description, status }`
- **Response:** `{ id, name, description, status, createdAt }`

### Update Category
- **PUT** `/categories/:id`
- **Body:** `{ name, description, status }`
- **Response:** `{ id, name, description, status, updatedAt }`

### Delete Category
- **DELETE** `/categories/:id`
- **Response:** `{ success, message }`

---

## 7. Orders APIs

### Get All Orders
- **GET** `/orders?page&limit&search&status&dealerId&userId&startDate&endDate&sortBy&sortOrder`
- **Response:** `{ orders[], pagination }`

### Get Order by ID
- **GET** `/orders/:id`
- **Response:** `{ id, orderNumber, user, dealer, items[], subtotal, tax, shipping, totalAmount, status, paymentStatus, paymentMethod, shippingAddress, billingAddress, tracking, timeline, createdAt }`

### Create Order
- **POST** `/orders`
- **Body:** `{ userId, dealerId, items[], shippingAddress, paymentMethod }`
- **Response:** `{ id, orderNumber, status, totalAmount, createdAt }`

### Update Order Status
- **PATCH** `/orders/:id/status`
- **Body:** `{ status, notes }`
- **Response:** `{ id, status, updatedAt }`

### Cancel Order
- **POST** `/orders/:id/cancel`
- **Body:** `{ reason }`
- **Response:** `{ id, status: "cancelled", cancellationReason, updatedAt }`

### Assign Dealer to Order
- **POST** `/orders/:id/assign-dealer`
- **Body:** `{ dealerId }`
- **Response:** `{ id, dealerId, updatedAt }`

### Add Tracking Information
- **POST** `/orders/:id/tracking`
- **Body:** `{ trackingNumber, carrier, status, estimatedDelivery }`
- **Response:** `{ tracking }`

### Get Order Timeline
- **GET** `/orders/:id/timeline`
- **Response:** `{ timeline[] }`

---

## 8. Reports APIs

### Get Sales Report
- **GET** `/reports/sales?startDate&endDate&groupBy&dealerId`
- **Response:** `{ totalSales, totalOrders, data[] }`

### Get Users Report
- **GET** `/reports/users?startDate&endDate&groupBy`
- **Response:** `{ totalUsers, newUsers, activeUsers, data[] }`

### Get Products Report
- **GET** `/reports/products?startDate&endDate&categoryId`
- **Response:** `{ topProducts[], lowStock[], data[] }`

### Export Report
- **GET** `/reports/export?type&format&startDate&endDate`
- **Response:** File download (Excel/PDF)

---

## 9. Settings APIs

### Get Settings
- **GET** `/settings`
- **Response:** `{ siteName, siteEmail, currency, taxRate, shippingCost }`

### Update Settings
- **PUT** `/settings`
- **Body:** `{ siteName, siteEmail, currency, taxRate, shippingCost }`
- **Response:** `{ success, data }`

---

## 10. File Upload APIs

### Upload File
- **POST** `/upload`
- **Body:** FormData `{ file, type }`
- **Response:** `{ url, filename, size, type }`

### Delete File
- **DELETE** `/upload/:fileId`
- **Response:** `{ success, message }`

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

### Common HTTP Status Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## Notes

- All dates: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- Pagination defaults: `page=1`, `limit=10`
- Max file upload: 10MB
- Supported image formats: JPG, PNG, WebP
- Rate limit: 100 requests/minute per IP

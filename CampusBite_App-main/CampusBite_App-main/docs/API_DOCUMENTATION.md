# 📡 CampusBite API Documentation

## 🌐 **API Overview**

The CampusBite API provides RESTful endpoints for managing users, vendors, orders, and cart functionality. All API responses are in JSON format and follow standard HTTP status codes.

---

## 🔐 **Authentication**

### **JWT Token Authentication**
All protected endpoints require a JWT token in the Authorization header:

```javascript
Authorization: Bearer <jwt_token>
```

### **Token Endpoints**

#### **POST /api/auth/login**
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "phone": "+1234567890"
    },
    "token": "jwt_token_here",
    "expires_in": 86400
  }
}
```

#### **POST /api/auth/register**
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "confirm_password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "phone": "+1234567890"
    },
    "token": "jwt_token_here"
  }
}
```

#### **POST /api/auth/logout**
Invalidate the current JWT token.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### **GET /api/auth/profile**
Get current user profile.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+1234567890",
    "avatar": "avatar_url",
    "preferences": {
      "dietary": ["vegetarian"],
      "favorites": ["vendor_id_1"]
    },
    "stats": {
      "total_orders": 25,
      "favorite_vendor": "Vendor Name"
    }
  }
}
```

---

## 🏪 **Vendor Endpoints**

### **GET /api/vendors**
Get all vendors with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search by name
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "vendor_id",
        "business_name": "The Grand Bistro",
        "category": "Restaurants",
        "image": "vendor_image_url",
        "rating": 4.8,
        "delivery_time": "15-20 mins",
        "free_delivery": true,
        "address": "123 Campus Street",
        "phone": "+1234567890",
        "description": "Fine dining restaurant"
      }
    ],
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

### **GET /api/vendors/:id**
Get specific vendor details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "vendor_id",
    "business_name": "The Grand Bistro",
    "category": "Restaurants",
    "image": "vendor_image_url",
    "rating": 4.8,
    "delivery_time": "15-20 mins",
    "free_delivery": true,
    "address": "123 Campus Street",
    "phone": "+1234567890",
    "description": "Fine dining restaurant",
    "menu": [
      {
        "id": "item_id",
        "name": "Classic Beef Burger",
        "description": "Juicy beef patty with fresh vegetables",
        "price": 8.99,
        "image": "item_image_url",
        "category": "Main Course",
        "available": true,
        "prep_time": "15 mins"
      }
    ]
  }
}
```

### **GET /api/vendors/:id/menu**
Get vendor's menu items.

**Query Parameters:**
- `category` (optional): Filter menu items by category
- `available` (optional): Filter by availability (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "menu": [
      {
        "id": "item_id",
        "name": "Classic Beef Burger",
        "description": "Juicy beef patty with fresh vegetables",
        "price": 8.99,
        "image": "item_image_url",
        "category": "Main Course",
        "available": true,
        "prep_time": "15 mins",
        "ingredients": ["beef", "lettuce", "tomato", "cheese"],
        "allergens": ["gluten", "dairy"]
      }
    ]
  }
}
```

---

## 📋 **Order Endpoints**

### **GET /api/orders**
Get user's orders with filtering.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by order status
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `search` (optional): Search by vendor or item name

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_id",
        "order_number": "ORD-123456",
        "user_id": "user_id",
        "vendor_id": "vendor_id",
        "vendor_name": "The Grand Bistro",
        "items": [
          {
            "id": "item_id",
            "name": "Classic Beef Burger",
            "price": 8.99,
            "quantity": 2,
            "subtotal": 17.98
          }
        ],
        "total_amount": 25.98,
        "status": "Delivered",
        "delivery_address": "123 Dorm Room, Campus",
        "created_at": "2024-01-15T12:30:00Z",
        "updated_at": "2024-01-15T13:45:00Z",
        "estimated_delivery": "2024-01-15T13:30:00Z"
      }
    ],
    "total": 25,
    "limit": 20,
    "offset": 0
  }
}
```

### **POST /api/orders**
Create a new order.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "vendor_id": "vendor_id",
  "items": [
    {
      "item_id": "item_id",
      "quantity": 2,
      "special_instructions": "No onions please"
    }
  ],
  "delivery_address": "123 Dorm Room, Campus",
  "payment_method": "credit_card",
  "tip_amount": 2.50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_id",
      "order_number": "ORD-123456",
      "vendor_id": "vendor_id",
      "vendor_name": "The Grand Bistro",
      "items": [
        {
          "id": "item_id",
          "name": "Classic Beef Burger",
          "price": 8.99,
          "quantity": 2,
          "subtotal": 17.98
        }
      ],
      "total_amount": 25.98,
      "status": "Received",
      "delivery_address": "123 Dorm Room, Campus",
      "created_at": "2024-01-15T12:30:00Z",
      "estimated_delivery": "2024-01-15T13:30:00Z"
    }
  }
}
```

### **GET /api/orders/:id**
Get specific order details.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_id",
      "order_number": "ORD-123456",
      "user_id": "user_id",
      "vendor_id": "vendor_id",
      "vendor_name": "The Grand Bistro",
      "vendor_info": {
        "phone": "+1234567890",
        "address": "123 Campus Street"
      },
      "items": [
        {
          "id": "item_id",
          "name": "Classic Beef Burger",
          "description": "Juicy beef patty with fresh vegetables",
          "price": 8.99,
          "quantity": 2,
          "subtotal": 17.98,
          "special_instructions": "No onions please"
        }
      ],
      "total_amount": 25.98,
      "delivery_fee": 3.00,
      "tax": 2.48,
      "tip_amount": 2.50,
      "status": "Delivered",
      "delivery_address": "123 Dorm Room, Campus",
      "created_at": "2024-01-15T12:30:00Z",
      "updated_at": "2024-01-15T13:45:00Z",
      "estimated_delivery": "2024-01-15T13:30:00Z",
      "delivered_at": "2024-01-15T13:45:00Z",
      "tracking": {
        "driver_name": "John Driver",
        "driver_phone": "+1234567890",
        "current_location": "Campus Gate",
        "estimated_arrival": "5 mins"
      }
    }
  }
}
```

### **PUT /api/orders/:id/status**
Update order status (vendor/driver only).

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "status": "Preparing",
  "notes": "Order is being prepared"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_id",
      "status": "Preparing",
      "updated_at": "2024-01-15T12:45:00Z"
    }
  }
}
```

---

## 🛒 **Cart Endpoints**

### **GET /api/cart**
Get user's current cart.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "cart_id",
      "user_id": "user_id",
      "items": [
        {
          "id": "cart_item_id",
          "item_id": "item_id",
          "vendor_id": "vendor_id",
          "vendor_name": "The Grand Bistro",
          "name": "Classic Beef Burger",
          "price": 8.99,
          "quantity": 2,
          "subtotal": 17.98,
          "special_instructions": "No onions please"
        }
      ],
      "total_amount": 25.98,
      "item_count": 2,
      "updated_at": "2024-01-15T12:30:00Z"
    }
  }
}
```

### **POST /api/cart/add**
Add item to cart.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "item_id": "item_id",
  "quantity": 2,
  "special_instructions": "No onions please"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart_item": {
      "id": "cart_item_id",
      "item_id": "item_id",
      "vendor_id": "vendor_id",
      "vendor_name": "The Grand Bistro",
      "name": "Classic Beef Burger",
      "price": 8.99,
      "quantity": 2,
      "subtotal": 17.98,
      "special_instructions": "No onions please"
    },
    "cart_total": 25.98,
    "item_count": 2
  }
}
```

### **PUT /api/cart/:itemId**
Update cart item quantity.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "quantity": 3,
  "special_instructions": "Extra cheese please"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart_item": {
      "id": "cart_item_id",
      "quantity": 3,
      "subtotal": 26.97,
      "special_instructions": "Extra cheese please"
    },
    "cart_total": 34.97,
    "item_count": 3
  }
}
```

### **DELETE /api/cart/:itemId**
Remove item from cart.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart_total": 17.99,
    "item_count": 1
  }
}
```

---

## 🔔 **Notification Endpoints**

### **GET /api/notifications**
Get user notifications.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `read` (optional): Filter by read status (true/false)
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification_id",
        "title": "Order Delivered",
        "message": "Your order from The Grand Bistro has been delivered",
        "type": "order_update",
        "read": false,
        "created_at": "2024-01-15T13:45:00Z",
        "data": {
          "order_id": "order_id",
          "order_number": "ORD-123456"
        }
      }
    ],
    "unread_count": 2,
    "total": 10
  }
}
```

### **PUT /api/notifications/:id/read**
Mark notification as read.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "notification_id",
      "read": true,
      "read_at": "2024-01-15T14:00:00Z"
    }
  }
}
```

---

## 📊 **Analytics Endpoints**

### **GET /api/analytics/user**
Get user analytics data.

**Headers:**
```javascript
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_orders": 25,
      "total_spent": 567.89,
      "favorite_vendor": "The Grand Bistro",
      "favorite_category": "Restaurants",
      "avg_order_value": 22.72,
      "order_frequency": "weekly"
    },
    "recent_activity": [
      {
        "type": "order",
        "description": "Placed order at The Grand Bistro",
        "timestamp": "2024-01-15T12:30:00Z"
      }
    ]
  }
}
```

---

## 🚨 **Error Responses**

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (if available)"
  }
}
```

### **Common Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## 🔄 **Rate Limiting**

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **Search endpoints**: 20 requests per minute

Rate limit headers are included in responses:
```javascript
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

---

## 🌐 **Webhooks**

### **Order Status Webhook**
Receive real-time order status updates:

**Endpoint:** Your configured webhook URL
**Method:** POST
**Headers:**
```javascript
X-CampusBite-Signature: <hmac_signature>
X-CampusBite-Event: order.status_updated
```

**Payload:**
```json
{
  "event": "order.status_updated",
  "data": {
    "order_id": "order_id",
    "status": "Delivered",
    "updated_at": "2024-01-15T13:45:00Z"
  }
}
```

---

## 🧪 **Testing**

### **Sandbox Environment**
For testing, use the sandbox environment:
- **Base URL**: `https://api-sandbox.campusbite.com`
- **Authentication**: Test tokens available in developer dashboard
- **Data**: Mock data for testing purposes

### **Test Credentials**
```javascript
// Test User
Email: test@campusbite.com
Password: test123456

// Test Vendor
Email: vendor@campusbite.com
Password: vendor123456
```

---

## 📱 **SDK Examples**

### **JavaScript/React Native**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.campusbite.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get vendors
const getVendors = async (category = null) => {
  try {
    const response = await api.get('/vendors', {
      params: { category }
    });
    return response.data.data.vendors;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
};
```

---

This API documentation provides comprehensive information for integrating with the CampusBite platform, including all endpoints, data models, error handling, and implementation examples.

# CORS Configuration Guide

This document explains how to handle CORS (Cross-Origin Resource Sharing) issues when deploying the frontend on Netlify and backend on Vercel.

## Understanding CORS

CORS is a security feature implemented by browsers that blocks requests from one origin (domain) to another unless the server explicitly allows it.

## Frontend Configuration (Already Done)

The frontend is configured to:
- Make requests to your Vercel backend
- Handle CORS errors gracefully
- Show user-friendly error messages

## Backend Configuration (Required on Vercel)

You need to configure CORS on your Vercel backend to allow requests from your Netlify frontend domain.

### For Express.js Backend

Add CORS middleware in your backend:

```javascript
const cors = require('cors');

// Allow specific origins (recommended for production)
const allowedOrigins = [
  'https://your-netlify-app.netlify.app',
  'https://your-custom-domain.com',
  'http://localhost:5173', // For local development
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // If you need to send cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));
```

### For Node.js/Express with Environment Variables

```javascript
const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));
```

### Environment Variables on Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - Key: `ALLOWED_ORIGINS`
   - Value: `https://your-netlify-app.netlify.app,https://your-custom-domain.com,http://localhost:5173`
   - Environment: Production, Preview, Development

## Testing CORS

### Check CORS Headers

After deployment, check if CORS headers are present:

```bash
curl -H "Origin: https://your-netlify-app.netlify.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://your-vercel-backend.vercel.app/api/auth/login \
     -v
```

You should see headers like:
```
Access-Control-Allow-Origin: https://your-netlify-app.netlify.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Common CORS Issues

### Issue 1: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**: Ensure your backend sets the `Access-Control-Allow-Origin` header.

### Issue 2: "Preflight request doesn't pass access control check"

**Solution**: Handle OPTIONS requests properly in your backend:

```javascript
app.options('*', cors()); // Enable preflight for all routes
```

### Issue 3: "Credentials flag is true, but Access-Control-Allow-Credentials is not"

**Solution**: If using `withCredentials: true` in frontend, set `credentials: true` in backend CORS config.

## Frontend Error Handling

The frontend automatically detects CORS errors and shows a user-friendly message:
- "CORS error: Please check backend CORS configuration"

This helps developers identify CORS issues quickly.

## Quick Checklist

- [ ] Backend CORS middleware configured
- [ ] Allowed origins include Netlify domain
- [ ] OPTIONS requests handled
- [ ] Environment variables set on Vercel
- [ ] Tested with actual Netlify deployment URL

## Additional Resources

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)


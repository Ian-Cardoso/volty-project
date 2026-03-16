# 🔒 Security Implementation - Phase 1

## ✅ Implemented Security Improvements

### 1. CORS with Whitelist
- **Before**: `app.use(cors())` - Allowed requests from ANY origin
- **After**: CORS whitelist configured via `ALLOWED_ORIGINS` env variable
- **Location**: [server.js](server.js#L48-L57)

**Benefits**:
- Prevents unauthorized cross-origin requests
- Only specified domains can access the API
- Configurable via environment variables

### 2. JWT Authentication with Refresh Tokens
- **Before**: Login returned only `userId` without authentication tokens
- **After**: Login returns both `accessToken` and `refreshToken`
- **Token Types**:
  - **Access Token**: Short-lived (15 minutes default), used for API requests
  - **Refresh Token**: Long-lived (7 days default), used to get new access tokens

**Location**: 
- Login endpoint: [server.js#L155-L184](server.js#L155-L184)
- Refresh endpoint: [server.js#L186-L206](server.js#L186-L206)
- Auth middleware: [server.js#L59-L72](server.js#L59-L72)

**How to use**:
```javascript
// 1. Login and get tokens
const loginRes = await fetch('/login', { /* ... */ })
const { accessToken, refreshToken, userId } = await loginRes.json()

// 2. Store tokens securely (not localStorage for sensitive apps)
sessionStorage.setItem('accessToken', accessToken)
sessionStorage.setItem('refreshToken', refreshToken)

// 3. Send accessToken with requests
fetch('/me/' + userId, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})

// 4. When token expires, use refresh endpoint
const refreshRes = await fetch('/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
})
const { accessToken: newToken } = await refreshRes.json()
```

### 3. Protected Routes with User Authorization
- **Updated endpoints** to require `authenticateToken` middleware
- **Added authorization checks** to prevent users from accessing/modifying other users' data
- **Protected endpoints**:
  - `GET /me/:id` - Get user profile
  - `PUT /me/:id` - Update user profile
  - `PUT /me/:id/password` - Change password
  - `POST /orders` - Create order
  - `GET /orders/:userId` - Get user orders
  - `POST /wishlist` - Add to wishlist
  - `GET /wishlist/:userId` - Get user wishlist
  - `DELETE /wishlist/:userId/:productId` - Remove from wishlist

### 4. Improved Password Management
- **Password change**: Now requires current password verification
- **Location**: [server.js#L138-L161](server.js#L138-L161)
- **Prevents**: Attackers from changing passwords without knowing the current one

### 5. Removed Hardcoded Secrets
- **Before**: Database credentials hardcoded in `checkUsers.js` (`password: '1504'`)
- **Before**: Passwords hardcoded in `registerTest.js` (`password: 'Abc123'`)
- **After**: All credentials come from environment variables
- **Files updated**:
  - [checkUsers.js](checkUsers.js) - Now requires proper `.env` setup
  - [registerTest.js](registerTest.js) - Password is parameterized

### 6. Environment Configuration
- **Created**: [.env.example](.env.example) - Template for required environment variables
- **Required variables**:
  ```env
  DB_USER=
  DB_PASSWORD=
  JWT_SECRET=
  JWT_REFRESH_SECRET=
  ALLOWED_ORIGINS=
  ```

---

## 📋 Setup Instructions

### 1. Create `.env` file
```bash
cp .env.example .env
```

### 2. Configure environment variables
Edit `.env` with your actual values:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=volty
DB_PASSWORD=your_secure_password
DB_PORT=5432

JWT_SECRET=generate_a_strong_secret_key_here
JWT_REFRESH_SECRET=another_strong_secret_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Generate strong secrets (Optional but recommended)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔐 Best Practices for Frontend

### Store tokens securely
```javascript
// ❌ DON'T - localStorage is vulnerable to XSS
localStorage.setItem('token', accessToken)

// ✅ DO - sessionStorage (cleared on tab close)
sessionStorage.setItem('token', accessToken)

// ✅ BETTER - HttpOnly cookies (backend sets with Set-Cookie header)
// This prevents JavaScript access entirely
```

### Implement token refresh automatically
```javascript
// Create a wrapper for fetch that handles token refresh
async function apiCall(url, options = {}) {
  let token = sessionStorage.getItem('accessToken')
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (response.status === 403) {
    // Token expired, try to refresh
    const refreshToken = sessionStorage.getItem('refreshToken')
    const refreshRes = await fetch('/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
    
    if (refreshRes.ok) {
      const { accessToken } = await refreshRes.json()
      sessionStorage.setItem('accessToken', accessToken)
      
      // Retry original request
      return apiCall(url, options)
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/html/login.html'
    }
  }
  
  return response
}
```

---

## ⚠️ Still TODO - Phase 2 and Beyond

- [ ] Implement rate limiting (prevent brute force attacks)
- [ ] Add request validation middleware
- [ ] Implement HTTPS/TLS in production
- [ ] Set secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Add logging and monitoring
- [ ] Implement CSRF protection
- [ ] Database connection pooling optimization
- [ ] Add API versioning (/v1/api)

---

## 🧪 Testing Security Changes

### Test JWT workflow
```bash
# 1. Register a user
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test123!"}'

# 2. Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# 3. Use the accessToken to access protected route
TOKEN="your_access_token_here"
curl http://localhost:3000/me/1 \
  -H "Authorization: Bearer $TOKEN"

# 4. Test refresh token
curl -X POST http://localhost:3000/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token"}'
```

---

## 📚 Security References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

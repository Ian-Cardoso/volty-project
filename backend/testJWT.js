const BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(type, message) {
  const timestamp = new Date().toLocaleTimeString();
  switch(type) {
    case 'success':
      console.log(`${colors.green}✓ [${timestamp}]${colors.reset} ${message}`);
      break;
    case 'error':
      console.log(`${colors.red}✗ [${timestamp}]${colors.reset} ${message}`);
      break;
    case 'info':
      console.log(`${colors.blue}ℹ [${timestamp}]${colors.reset} ${message}`);
      break;
    case 'test':
      console.log(`\n${colors.cyan}━━━ ${message} ━━━${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}⚠ [${timestamp}]${colors.reset} ${message}`);
      break;
  }
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    log('error', `Request failed: ${error.message}`);
    throw error;
  }
}

// Test Suite
async function runTests() {
  log('test', 'JWT Authentication Test Suite');
  
  const testUser = {
    name: 'JWT Test User',
    email: `jwt-test-${Date.now()}@test.com`,
    password: 'TestPassword123!'
  };

  let userId;
  let accessToken;
  let refreshToken;

  try {
    // Test 1: Register
    log('test', '1. User Registration');
    let result = await makeRequest('POST', '/register', testUser);
    
    if (result.ok) {
      log('success', `User registered: ${result.data.user.email}`);
      userId = result.data.user.id;
    } else {
      log('error', `Registration failed: ${result.data.error}`);
      return;
    }

    // Test 2: Login
    log('test', '2. User Login');
    result = await makeRequest('POST', '/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (result.ok && result.data.accessToken && result.data.refreshToken) {
      log('success', `Login successful`);
      accessToken = result.data.accessToken;
      refreshToken = result.data.refreshToken;
      log('info', `Access Token: ${accessToken.substring(0, 20)}...`);
      log('info', `Refresh Token: ${refreshToken.substring(0, 20)}...`);
    } else {
      log('error', `Login failed: ${result.data.error}`);
      return;
    }

    // Test 3: Access protected route WITH valid token
    log('test', '3. Access Protected Route WITH Valid Token');
    result = await makeRequest('GET', `/me/${userId}`, null, accessToken);

    if (result.ok) {
      log('success', `Protected route accessible`);
      log('info', `User data: ${JSON.stringify(result.data)}`);
    } else {
      log('error', `Access denied: ${result.data.error}`);
    }

    // Test 4: Access protected route WITHOUT token
    log('test', '4. Access Protected Route WITHOUT Token (Should Fail)');
    result = await makeRequest('GET', `/me/${userId}`, null, null);

    if (!result.ok && result.status === 401) {
      log('success', `Correctly denied access without token (${result.data.error})`);
    } else {
      log('error', `Security issue: Route should require token but allowed access`);
    }

    // Test 5: Access protected route WITH invalid token
    log('test', '5. Access Protected Route WITH Invalid Token (Should Fail)');
    result = await makeRequest('GET', `/me/${userId}`, null, 'invalid.token.here');

    if (!result.ok && result.status === 403) {
      log('success', `Correctly rejected invalid token (${result.data.error})`);
    } else {
      log('error', `Security issue: Should reject invalid token`);
    }

    // Test 6: Refresh token
    log('test', '6. Refresh Token');
    result = await makeRequest('POST', '/refresh-token', { refreshToken });

    if (result.ok && result.data.accessToken) {
      log('success', `Token refreshed successfully`);
      const newAccessToken = result.data.accessToken;
      log('info', `New Access Token: ${newAccessToken.substring(0, 20)}...`);
      
      // Verify new token works
      result = await makeRequest('GET', `/me/${userId}`, null, newAccessToken);
      if (result.ok) {
        log('success', `New token works correctly`);
      } else {
        log('error', `New token not working: ${result.data.error}`);
      }
    } else {
      log('error', `Token refresh failed: ${result.data.error}`);
    }

    // Test 7: Invalid refresh token
    log('test', '7. Invalid Refresh Token (Should Fail)');
    result = await makeRequest('POST', '/refresh-token', { 
      refreshToken: 'invalid.refresh.token' 
    });

    if (!result.ok && result.status === 403) {
      log('success', `Correctly rejected invalid refresh token`);
    } else {
      log('error', `Security issue: Should reject invalid refresh token`);
    }

    // Test 8: Authorization - User cannot access another user's data
    log('test', '8. Authorization Check (User cannot access other user data)');
    
    // Create a second user
    const testUser2 = {
      name: 'Another User',
      email: `jwt-test-user2-${Date.now()}@test.com`,
      password: 'Password123!'
    };
    
    result = await makeRequest('POST', '/register', testUser2);
    if (!result.ok) {
      log('warning', `Could not create second user for authorization test`);
    } else {
      const user2Id = result.data.user.id;
      
      // Try to access user2's profile with user1's token
      result = await makeRequest('GET', `/me/${user2Id}`, null, accessToken);
      
      if (!result.ok && result.status === 403) {
        log('success', `Correctly denied access to another user's data`);
      } else {
        log('error', `Security issue: User can access another user's profile!`);
      }
    }

    // Test 9: Update profile with token
    log('test', '9. Update Protected Resource (Profile)');
    result = await makeRequest('PUT', `/me/${userId}`, {
      name: 'Updated Name',
      cep: '12345-678',
      street: 'Test Street',
      city: 'Test City',
      state: 'TS'
    }, accessToken);

    if (result.ok) {
      log('success', `Profile updated successfully`);
    } else {
      log('error', `Profile update failed: ${result.data.error}`);
    }

    // Test 10: Try to update without token
    log('test', '10. Update Protected Resource WITHOUT Token (Should Fail)');
    result = await makeRequest('PUT', `/me/${userId}`, {
      name: 'Hacker Name'
    }, null);

    if (!result.ok && result.status === 401) {
      log('success', `Correctly denied update without token`);
    } else {
      log('error', `Security issue: Update allowed without token!`);
    }

    log('test', 'All Tests Completed! ✓');

  } catch (error) {
    log('error', `Test suite error: ${error.message}`);
  }
}

// Run tests
console.log('\n' + colors.cyan + '═'.repeat(50) + colors.reset);
console.log(colors.blue + '     JWT Authentication Testing Suite' + colors.reset);
console.log(colors.cyan + '═'.repeat(50) + colors.reset + '\n');

log('info', `Testing: ${BASE_URL}`);
log('info', 'Make sure the server is running: npm run dev\n');

runTests().then(() => {
  console.log('\n' + colors.cyan + '═'.repeat(50) + colors.reset + '\n');
}).catch(error => {
  log('error', `Fatal error: ${error.message}`);
  process.exit(1);
});

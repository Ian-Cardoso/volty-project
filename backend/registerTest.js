
async function testRegister(email, password = 'TestPassword123!') {
  const res = await fetch('http://localhost:3000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      name: 'Test User', 
      email, 
      password // Pass password as parameter, don't hardcode
    })
  });
  const data = await res.json();
  console.log('register', email, '=>', res.status, data);
  return data;
}

async function testLogin(email, password = 'TestPassword123!') {
  const res = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  console.log('login', email, '=>', res.status, data);
  return data;
}

// SECURITY NOTE: Only run this test with valid credentials
// Do NOT commit real passwords - use environment variables in production
(async()=>{
  // Example usage (modify with test credentials):
  console.log('⚠️ Modify test credentials before running');
  // await testRegister('test@example.com', 'your_test_password');
  // await testLogin('test@example.com', 'your_test_password');
})();

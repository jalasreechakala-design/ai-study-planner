const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', err => reject(err));
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function testAuthFullFlow() {
  console.log('--- STARTING COMPREHENSIVE AUTHENTICATION VERIFICATION SUITE ---');

  const testEmail = `auth_tester_${Date.now()}@university.edu`;

  // Test 1: Register New Student
  console.log('\n[TEST 1] Valid Student Registration...');
  const regRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Authentication Tester',
    email: testEmail,
    password: 'Password123',
    confirmPassword: 'Password123',
    phone: '+1 555-0133',
    college: 'Stanford University',
    course: 'M.S',
    branch: 'Computer Science',
    year_of_study: '1st Year'
  });
  console.log(`Status: ${regRes.status}`, regRes.data);
  if (regRes.status !== 201 || !regRes.data.token) throw new Error('Test 1 Failed: Student registration unsuccessful.');

  const studentToken = regRes.data.token;

  // Test 2: Duplicate Email Registration Error
  console.log('\n[TEST 2] Duplicate Email Registration Error...');
  const dupRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Duplicate Tester',
    email: testEmail,
    password: 'Password123',
    confirmPassword: 'Password123',
    college: 'Stanford',
    course: 'M.S',
    branch: 'CS',
    year_of_study: '1st Year'
  });
  console.log(`Status: ${dupRes.status}`, dupRes.data);
  if (dupRes.status !== 400) throw new Error('Test 2 Failed: Duplicate email not blocked.');

  // Test 3: Invalid Email Format Error
  console.log('\n[TEST 3] Invalid Email Format Validation...');
  const invalidEmailRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Invalid Email User',
    email: 'not-an-email',
    password: 'Password123',
    confirmPassword: 'Password123',
    college: 'Stanford',
    course: 'M.S',
    branch: 'CS',
    year_of_study: '1st Year'
  });
  console.log(`Status: ${invalidEmailRes.status}`, invalidEmailRes.data);
  if (invalidEmailRes.status !== 400) throw new Error('Test 3 Failed: Invalid email format accepted.');

  // Test 4: Weak Password Error
  console.log('\n[TEST 4] Weak Password Strength Validation...');
  const weakPassRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Weak Pass User',
    email: `weak_${Date.now()}@univ.edu`,
    password: '123', // less than 6 chars
    confirmPassword: '123',
    college: 'Stanford',
    course: 'M.S',
    branch: 'CS',
    year_of_study: '1st Year'
  });
  console.log(`Status: ${weakPassRes.status}`, weakPassRes.data);
  if (weakPassRes.status !== 400) throw new Error('Test 4 Failed: Weak password accepted.');

  // Test 5: Student Login (Valid Credentials)
  console.log('\n[TEST 5] Student Login (Valid Credentials)...');
  const loginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'Password123' });
  console.log(`Status: ${loginRes.status}`, { tokenAcquired: !!loginRes.data.token, userRole: loginRes.data.user?.role });
  if (loginRes.status !== 200 || !loginRes.data.token) throw new Error('Test 5 Failed: Student login failed.');

  // Test 6: Student Login (Incorrect Password)
  console.log('\n[TEST 6] Student Login (Incorrect Password)...');
  const wrongPassRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'WrongPassword99' });
  console.log(`Status: ${wrongPassRes.status}`, wrongPassRes.data);
  if (wrongPassRes.status !== 401) throw new Error('Test 6 Failed: Wrong password allowed login.');

  // Test 7: Profile Persistence (`GET /api/auth/profile`)
  console.log('\n[TEST 7] Profile Persistence Check (GET /api/auth/profile)...');
  const profRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/profile',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`Status: ${profRes.status}`, profRes.data.user ? { name: profRes.data.user.name, college: profRes.data.user.profile?.college } : profRes.data);
  if (profRes.status !== 200 || !profRes.data.user) throw new Error('Test 7 Failed: Profile persistence check failed.');

  // Test 8: Admin Login & Authorization Security Check
  console.log('\n[TEST 8] Admin Login with System Credentials...');
  const adminLoginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@platform.com', password: 'Admin@123456' });
  console.log(`Status: ${adminLoginRes.status}`, { role: adminLoginRes.data.user?.role });
  if (adminLoginRes.status !== 200 || adminLoginRes.data.user.role !== 'admin') throw new Error('Test 8 Failed: Admin login failed.');

  // Test 9: Student Accessing Admin Endpoint (403 Forbidden Block)
  console.log('\n[TEST 9] Student Authorization Error Check on Admin API (/api/admin/stats)...');
  const blockRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`Status: ${blockRes.status} (Expected 403 Forbidden)`, blockRes.data);
  if (blockRes.status !== 403) throw new Error('Test 9 Failed: Student was not blocked from Admin API.');

  // Test 10: Admin Accessing Admin Endpoint (200 OK)
  console.log('\n[TEST 10] Admin Accessing Admin API (/api/admin/stats)...');
  const adminApiRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminLoginRes.data.token}` }
  });
  console.log(`Status: ${adminApiRes.status} (Expected 200 OK)`, adminApiRes.data.stats ? 'Stats retrieved successfully' : adminApiRes.data);
  if (adminApiRes.status !== 200) throw new Error('Test 10 Failed: Admin API access failed.');

  console.log('\n--- ALL AUTHENTICATION & SECURITY VERIFICATION TESTS PASSED PERFECTLY ---');
}

testAuthFullFlow().catch(console.error);

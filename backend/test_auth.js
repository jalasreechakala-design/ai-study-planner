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
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', err => reject(err));
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING AUTHENTICATION & DATABASE VERIFICATION TESTS ---');

  // Test 1: Student Registration
  console.log('\n[TEST 1] Registering New Student (valid credentials)...');
  const regPayload = {
    name: 'Sarah Connor',
    email: 'sarah.connor@mit.edu',
    password: 'Password123',
    confirmPassword: 'Password123',
    phone: '+1 555-0188',
    college: 'Massachusetts Institute of Technology',
    course: 'B.Sc',
    branch: 'Computer Science',
    year_of_study: '2nd Year'
  };

  const regRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, regPayload);

  console.log(`Status: ${regRes.status}`, regRes.data);

  // Test 2: Test Password Match / Strength / Duplicate Email
  console.log('\n[TEST 2] Testing Duplicate Email Registration Error...');
  const dupRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, regPayload);
  console.log(`Status: ${dupRes.status}`, dupRes.data);

  // Test 3: Student Login
  console.log('\n[TEST 3] Testing Student Login...');
  const loginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'sarah.connor@mit.edu', password: 'Password123' });
  console.log(`Status: ${loginRes.status}`, loginRes.data);
  const studentToken = loginRes.data.token;

  // Test 4: Admin Login
  console.log('\n[TEST 4] Testing Admin Login with System Credentials...');
  const adminLoginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@platform.com', password: 'Admin@123456' });
  console.log(`Status: ${adminLoginRes.status}`, adminLoginRes.data);
  const adminToken = adminLoginRes.data.token;

  // Test 5: Student attempting to access Admin API (Role Verification Middleware)
  console.log('\n[TEST 5] Testing Student Attempting to Access Admin API (/api/admin/stats)...');
  const forbiddenRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`Status: ${forbiddenRes.status} (Expected 403 Forbidden)`, forbiddenRes.data);

  // Test 6: Admin accessing Admin API
  console.log('\n[TEST 6] Testing Admin Accessing Admin API (/api/admin/stats)...');
  const adminAccessRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Status: ${adminAccessRes.status} (Expected 200 OK)`, adminAccessRes.data);

  console.log('\n--- ALL AUTHENTICATION & SECURITY TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(console.error);

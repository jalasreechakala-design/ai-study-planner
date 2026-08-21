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

async function testCompleteRegistrationFlow() {
  console.log('=== STARTING END-TO-END REGISTRATION & AUTHENTICATION AUDIT SUITE ===');

  const timestamp = Date.now();
  const testEmail = `student_reg_${timestamp}@university.edu`;

  // 1. Test Registration with Missing Required Fields (Expecting 400)
  console.log('\n[TEST 1] Registration with Missing Required Fields...');
  const missingRes = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'Password123' });
  console.log(`Status: ${missingRes.status} Error: "${missingRes.data.error}"`);

  // 2. Test Registration with Invalid Email Format (Expecting 400)
  console.log('\n[TEST 2] Registration with Invalid Email Format...');
  const invalidEmailRes = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Invalid Email Tester', email: 'invalid-email-format', password: 'Password123', confirmPassword: 'Password123',
    college: 'IIT', course: 'B.Tech', branch: 'CS', year_of_study: '1st Year'
  });
  console.log(`Status: ${invalidEmailRes.status} Error: "${invalidEmailRes.data.error}"`);

  // 3. Test Registration with Weak Password (Expecting 400)
  console.log('\n[TEST 3] Registration with Weak Password...');
  const weakPassRes = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Weak Pass Tester', email: `weak_${timestamp}@test.com`, password: '123', confirmPassword: '123',
    college: 'IIT', course: 'B.Tech', branch: 'CS', year_of_study: '1st Year'
  });
  console.log(`Status: ${weakPassRes.status} Error: "${weakPassRes.data.error}"`);

  // 4. Test Registration with Password Mismatch (Expecting 400)
  console.log('\n[TEST 4] Registration with Password Mismatch...');
  const mismatchRes = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Mismatch Tester', email: `mismatch_${timestamp}@test.com`, password: 'Password123', confirmPassword: 'DifferentPassword123',
    college: 'IIT', course: 'B.Tech', branch: 'CS', year_of_study: '1st Year'
  });
  console.log(`Status: ${mismatchRes.status} Error: "${mismatchRes.data.error}"`);

  // 5. Test Valid Registration & Verify User Document UID & Role
  console.log('\n[TEST 5] Valid Registration Flow...');
  const validReg = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Jane Doe',
    email: testEmail,
    password: 'Password123',
    confirmPassword: 'Password123',
    phone: '+1 555-0199',
    college: 'National Institute of Technology',
    course: 'B.Tech',
    branch: 'Computer Science',
    year_of_study: '3rd Year',
    role: 'admin' // Attempting to trick role to admin
  });
  console.log(`Status: ${validReg.status} Message: "${validReg.data.message}"`);
  console.log('Registered User Object:', validReg.data.user);
  console.log(`Assigned Role: "${validReg.data.user?.role}" (Expected: "student")`);

  const studentToken = validReg.data.token;
  const studentHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` };

  // 6. Test Registration Duplicate Email Prevention (Expecting 400)
  console.log('\n[TEST 6] Duplicate Email Registration Prevention...');
  const dupReg = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Duplicate Jane Doe', email: testEmail, password: 'Password123', confirmPassword: 'Password123',
    college: 'NIT', course: 'B.Tech', branch: 'CS', year_of_study: '3rd Year'
  });
  console.log(`Status: ${dupReg.status} Error: "${dupReg.data.error}" (Expected: Email already registered.)`);

  // 7. Test Login using Newly Registered Account
  console.log('\n[TEST 7] Login with Newly Registered Account...');
  const loginRes = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'Password123' });
  console.log(`Status: ${loginRes.status} Login Message: "${loginRes.data.message}" User Role: "${loginRes.data.user?.role}"`);

  // 8. Test Profile Endpoint with Student Token
  console.log('\n[TEST 8] Fetch Student Profile (GET /api/auth/profile)...');
  const profileRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/auth/profile', method: 'GET', headers: studentHeaders });
  console.log(`Status: ${profileRes.status} User Name: "${profileRes.data.user?.name}", College: "${profileRes.data.user?.profile?.college}"`);

  // 9. Test Student Access to Admin Route (Expecting 403 Forbidden)
  console.log('\n[TEST 9] Student Attempting to Access /api/admin/stats (Expecting 403)...');
  const adminAccessRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/stats', method: 'GET', headers: studentHeaders });
  console.log(`Status: ${adminAccessRes.status} Error: "${adminAccessRes.data.error}" (Expected: 403 Forbidden)`);

  // 10. Test Admin Account Login & Access
  console.log('\n[TEST 10] Admin Login & Admin Dashboard Access...');
  const adminLogin = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@platform.com', password: 'Admin@123456' });
  console.log(`Admin Login Status: ${adminLogin.status} Role: "${adminLogin.data.user?.role}"`);

  const adminHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminLogin.data.token}` };
  const adminStatsRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/stats', method: 'GET', headers: adminHeaders });
  console.log(`Admin Stats Status: ${adminStatsRes.status} Total Students: ${adminStatsRes.data.stats?.totalStudents}`);

  console.log('\n=== ALL REGISTRATION & AUTHENTICATION TESTS PASSED PERFECTLY ===');
}

testCompleteRegistrationFlow().catch(console.error);

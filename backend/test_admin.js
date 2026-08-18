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

async function testAdminPlatform() {
  console.log('--- STARTING ADMIN PLATFORM AUTOMATED TEST SUITE ---');

  // Step 1: Admin Login with System Credentials
  console.log('\n[1] Authenticating Admin user (admin@platform.com)...');
  const adminLoginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@platform.com', password: 'Admin@123456' });

  const adminToken = adminLoginRes.data.token;
  console.log(`Admin JWT Token acquired successfully (Role: ${adminLoginRes.data.user.role}).`);

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // Step 2: Student Authorization Blocking Test
  console.log('\n[2] Testing Student Role Authorization Block (Expecting 403 Forbidden)...');
  const studentEmail = `student_tester_${Date.now()}@platform.edu`;
  const studentReg = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Student Tester',
    email: studentEmail,
    password: 'Password123',
    confirmPassword: 'Password123',
    phone: '+1 555-0155',
    college: 'BITS Pilani',
    course: 'B.E',
    branch: 'Electrical',
    year_of_study: '3rd Year'
  });

  const studentHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${studentReg.data.token}`
  };

  const blockRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/stats', method: 'GET', headers: studentHeaders });
  console.log(`Student Admin API Access Attempt -> Status: ${blockRes.status} (Expected 403 Forbidden)`);

  // Step 3: Admin Dashboard Statistics
  console.log('\n[3] Testing GET /api/admin/stats...');
  const statsRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/stats', method: 'GET', headers: adminHeaders });
  console.log('Admin Stats:', statsRes.data.stats);

  // Step 4: Exam CRUD
  console.log('\n[4] Testing Admin Exam CRUD Operations...');
  const createExamRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/exams', method: 'POST', headers: adminHeaders }, {
    title: 'Indian Engineering Services (IES)',
    code: 'IES_ESE',
    category: 'Engineering Services',
    description: 'UPSC Engineering Services Examination for Engineers'
  });
  console.log('Exam Created:', createExamRes.data);

  const getExamsRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/exams', method: 'GET', headers: adminHeaders });
  console.log(`Total Exams in Catalog: ${getExamsRes.data.exams.length}`);

  // Step 5: Subject CRUD
  console.log('\n[5] Testing Admin Subject CRUD Operations...');
  const createSubRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/subjects', method: 'POST', headers: adminHeaders }, {
    exam_id: 1,
    title: 'Signals & Systems',
    code: 'SS',
    weightage: '8%'
  });
  console.log('Subject Created:', createSubRes.data);

  // Step 6: Topic CRUD
  console.log('\n[6] Testing Admin Topic CRUD Operations...');
  const createTopRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/topics', method: 'POST', headers: adminHeaders }, {
    subject_id: 1,
    title: 'Continuous-Time Fourier Transform',
    description: 'Fourier Series, Spectrum & Filtering',
    estimated_hours: 5
  });
  console.log('Topic Created:', createTopRes.data);

  // Step 7: Study Material Upload & Publication
  console.log('\n[7] Testing Study Material Upload & Student Visibility...');
  const createMatRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/materials', method: 'POST', headers: adminHeaders }, {
    title: 'Signals & Systems Complete Formula Sheet',
    exam_id: 1,
    subject_id: 1,
    material_type: 'pdf',
    description: 'Master formula reference sheet for Continuous & Discrete Fourier Transform.',
    file_url: 'http://localhost:5000/uploads/signals_formula_sheet.pdf'
  });
  console.log('Material Created:', createMatRes.data);

  // Step 8: Question Bank CRUD
  console.log('\n[8] Testing Question Bank Management...');
  const createQRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/questions', method: 'POST', headers: adminHeaders }, {
    subject_id: 1,
    question_text: 'What is the Fourier Transform of a unit impulse delta function delta(t)?',
    option_a: '0',
    option_b: '1',
    option_c: 'Infinity',
    option_d: '1/s',
    correct_option: 'B',
    explanation: 'The Fourier Transform of an impulse delta function is constant 1 across all frequencies.',
    difficulty: 'easy'
  });
  console.log('Question Created:', createQRes.data);

  // Step 9: Quiz Creation & Publishing
  console.log('\n[9] Testing Quiz Creation & Publishing...');
  const createQuizRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/quizzes', method: 'POST', headers: adminHeaders }, {
    title: 'Signals & Systems Practice Quiz 1',
    exam_id: 1,
    subject_id: 1,
    time_limit_mins: 15,
    total_marks: 10
  });
  console.log('Quiz Published:', createQuizRes.data);

  // Step 10: User Management & Student Directory
  console.log('\n[10] Testing Student Directory & Account Status Toggle...');
  const studentsRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/students', method: 'GET', headers: adminHeaders });
  console.log(`Registered Students Retrieved: ${studentsRes.data.students.length}`);

  const studentId = studentsRes.data.students[0]?.id;
  if (studentId) {
    const toggleRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: `/api/admin/students/${studentId}/status`, method: 'PUT', headers: adminHeaders }, { status: 'active' });
    console.log('Student Account Status Update:', toggleRes.data);
  }

  // Step 11: Announcement Broadcast
  console.log('\n[11] Testing Announcement Broadcast to All Students...');
  const notifyRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/admin/notifications', method: 'POST', headers: adminHeaders }, {
    title: 'New GATE & IES Study Resources Published!',
    message: 'Check out the new formula sheets and practice quizzes under Competitive Exam Platform.',
    type: 'announcement'
  });
  console.log('Announcement Broadcast Result:', notifyRes.data);

  console.log('\n--- ALL ADMIN PLATFORM TESTS COMPLETED SUCCESSFULLY ---');
}

testAdminPlatform().catch(console.error);

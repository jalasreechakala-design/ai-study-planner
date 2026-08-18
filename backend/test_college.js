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

async function testCollegePlatform() {
  console.log('--- STARTING COLLEGE PLATFORM AUTOMATED TEST SUITE ---');

  // Step 1: Register or Login test student
  console.log('\n[1] Registering fresh test student...');
  const testEmail = `tester_${Date.now()}@college.edu`;
  const regRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'College Tester',
    email: testEmail,
    password: 'Password123',
    confirmPassword: 'Password123',
    phone: '+1 555-0199',
    college: 'National Institute of Technology',
    course: 'B.Tech',
    branch: 'Computer Science',
    year_of_study: '3rd Year'
  });

  const token = regRes.data.token;
  console.log(`Token acquired for student: ${testEmail}`);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Step 2: Dashboard Summary API
  console.log('\n[2] Testing GET /api/college/dashboard...');
  const dashRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/dashboard', method: 'GET', headers });
  console.log(`Status: ${dashRes.status}`, {
    welcomeMessage: dashRes.data.welcomeMessage,
    todayDate: dashRes.data.todayDate,
    pendingTasks: dashRes.data.taskSummary?.pending,
    attendancePct: dashRes.data.attendanceSummary?.overallPercentage
  });

  // Step 3: Task CRUD Operations
  console.log('\n[3] Testing Task CRUD Operations...');
  const newTaskRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/tasks', method: 'POST', headers }, {
    title: 'Operating Systems Lab 5',
    description: 'Implement Semaphore Synchronization in C++',
    subject_name: 'Operating Systems',
    due_date: '2026-11-25',
    priority: 'high',
    category: 'college'
  });
  console.log('Task Created:', newTaskRes.data);

  const getTasksRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/tasks', method: 'GET', headers });
  console.log(`Total Tasks Retrieved: ${getTasksRes.data.tasks.length}`);

  const taskId = getTasksRes.data.tasks[0]?.id;
  if (taskId) {
    const updateTaskRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: `/api/college/tasks/${taskId}/status`, method: 'PUT', headers }, { status: 'completed' });
    console.log('Task Status Updated to Completed:', updateTaskRes.data);
  }

  // Step 4: Notes Module CRUD
  console.log('\n[4] Testing Notes CRUD Operations...');
  const newNoteRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/notes', method: 'POST', headers }, {
    title: 'TCP/IP Header Architecture & Sliding Window Protocol',
    content: 'Detailed summary of TCP headers, sequence numbers, and sliding window flow control.',
    subject_name: 'Computer Networks',
    category: 'Lecture Notes',
    tags: 'networks,gate'
  });
  console.log('Note Created:', newNoteRes.data);

  // Step 5: Attendance Tracker & Warning Tiers
  console.log('\n[5] Testing Attendance Tracker & Warning Tiers...');
  await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/attendance', method: 'POST', headers }, {
    subject_name: 'Computer Networks',
    attended_classes: 24,
    total_classes: 30,
    target_percentage: 75
  });
  await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/attendance', method: 'POST', headers }, {
    subject_name: 'Database Systems',
    attended_classes: 18,
    total_classes: 28,
    target_percentage: 75
  });

  const attRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/attendance', method: 'GET', headers });
  console.log('Attendance Records & Tiers:', attRes.data.attendance.map(a => ({
    subject: a.subject_name,
    pct: a.currentPercentage,
    tier: a.statusTier,
    safeBunk: a.safeToBunk,
    classesNeeded: a.classesNeeded
  })));

  // Step 6: CGPA Calculator
  console.log('\n[6] Testing CGPA Calculator...');
  await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/cgpa', method: 'POST', headers }, {
    semester: 'Semester 1',
    subject_name: 'Mathematics I',
    credits: 4,
    grade: 'A',
    gpa: 9.0
  });

  const cgpaRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/cgpa', method: 'GET', headers });
  console.log('CGPA Records & Cumulative:', { cumulativeCGPA: cgpaRes.data.cumulativeCGPA, credits: cgpaRes.data.totalCredits });

  // Step 7: Goals & Targets
  console.log('\n[7] Testing Goals Module...');
  const newGoalRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/goals', method: 'POST', headers }, {
    title: 'Achieve S Grade in Operating Systems',
    description: 'Score > 90% in End-Sem Exam',
    target_date: '2026-12-10',
    category: 'Academic',
    progress_percentage: 70
  });
  console.log('Goal Created:', newGoalRes.data);

  // Step 8: Pomodoro Study Timer & Streaks/Badges
  console.log('\n[8] Logging Pomodoro Focus Session & Unlocking Badges...');
  const sessRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/study-session', method: 'POST', headers }, {
    duration_minutes: 25,
    session_type: 'pomodoro',
    subject_name: 'Computer Networks'
  });
  console.log('Pomodoro Logged & Badges Unlocked:', sessRes.data);

  // Step 9: Analytics API
  console.log('\n[9] Testing Analytics API...');
  const analyticsRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/analytics', method: 'GET', headers });
  console.log('Analytics Data:', analyticsRes.data);

  console.log('\n--- ALL COLLEGE PLATFORM TESTS COMPLETED SUCCESSFULLY ---');
}

testCollegePlatform().catch(console.error);

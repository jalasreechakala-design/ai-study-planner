const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', err => reject(err));
    if (body) req.write(dataString);
    req.end();
  });
}

async function runDashboardTest() {
  console.log('=======================================================');
  console.log('📊 STARTING DASHBOARD SECTIONS & FIRESTORE TEST');
  console.log('=======================================================');

  try {
    const email = `dash_user_${Date.now()}@example.com`;
    console.log(`\n[STEP 1] Registering fresh student user (${email})...`);
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Dashboard Student',
      email,
      password: 'Password123',
      college: 'MIT',
      course: 'B.Tech',
      branch: 'Computer Science',
      year_of_study: '3rd Year'
    });

    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }

    const token = regRes.data.token;
    const userId = regRes.data.user.id;
    console.log(`✅ User Registered (ID: ${userId})`);

    console.log('\n[STEP 2] Fetching College Dashboard Summary from Firestore...');
    const dashRes = await request('GET', '/api/college/dashboard', null, token);

    console.log('Dashboard API Status:', dashRes.status);
    const summary = dashRes.data;

    console.log('\n[STEP 3] Validating Presence of All Intended Dashboard Sections:');
    const sections = {
      'User/Profile Information': !!summary.profile || !!summary.welcomeMessage,
      'Current Streak': summary.studySummary?.currentStreak !== undefined,
      'Longest Streak': summary.studySummary?.longestStreak !== undefined,
      'Tasks Summary & Upcoming Tasks': !!summary.taskSummary,
      'Notes Summary': !!summary.notesSummary,
      'Subjects Overview': !!summary.subjectsSummary,
      'Assignments Summary': !!summary.assignmentsSummary,
      'Reminders Summary': !!summary.remindersSummary,
      'Attendance Health': !!summary.attendanceSummary,
      'CGPA Analytics': !!summary.cgpaSummary,
      'Study Progress & Hours': !!summary.studySummary
    };

    let allPassed = true;
    for (const [name, present] of Object.entries(sections)) {
      if (present) {
        console.log(`  ✅ ${name}: PRESENT`);
      } else {
        console.error(`  ❌ ${name}: MISSING!`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n=======================================================');
      console.log('🎉 ALL 11 DASHBOARD SECTIONS VERIFIED & OPERATIONAL 100%');
      console.log('=======================================================');
    } else {
      console.error('❌ DASHBOARD SECTIONS VERIFICATION FAILED');
    }
  } catch (err) {
    console.error('❌ Dashboard Test Error:', err.message);
  }
}

runDashboardTest();

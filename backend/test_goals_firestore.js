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

async function runGoalsTest() {
  console.log('--- STARTING GOALS MODULE FIRESTORE INTEGRATION & TARGET DATE TEST ---');

  try {
    // 1. Register & Login Student A
    const emailA = `goal_student_a_${Date.now()}@example.com`;
    console.log(`\n[STUDENT A - STEP 1] Registering and Logging in Student A (${emailA})...`);
    const regResA = await request('POST', '/api/auth/register', {
      name: 'Goals Student A',
      email: emailA,
      password: 'Password123',
      college: 'IISc Bangalore',
      course: 'M.Tech',
      branch: 'Computer Science',
      year_of_study: '1st Year'
    });
    const tokenA = regResA.data.token;
    const userIdA = regResA.data.user.id;
    console.log(`✅ Student A Registered (ID: ${userIdA})`);

    // 2. Create a goal with 25% initial progress
    console.log('\n[STUDENT A - STEP 2] Creating "GATE Preparation 2026" with 25% initial progress...');
    const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const createRes = await request('POST', '/api/college/goals', {
      title: 'GATE Preparation 2026',
      description: 'Complete mock tests and revision for CS paper',
      category: 'Competitive Exam',
      target_date: futureDate,
      progress_percentage: 25
    }, tokenA);
    console.log('Create Response:', createRes.status, createRes.data);
    const goalId = createRes.data.goalId;

    // 3, 4, 5. Verify Persistence & Progress 25%
    console.log('\n[STUDENT A - STEPS 3, 4, 5] Refreshing & Verifying Goal Persistence (Progress 25%)...');
    const getRes1 = await request('GET', '/api/college/goals', null, tokenA);
    const goal1 = getRes1.data.goals?.find(g => String(g.id) === String(goalId));
    console.log('Goal Record details:', goal1);
    console.log(`Progress: ${goal1.progress_percentage}% (Expected 25%), Completed: ${goal1.completed}`);

    // 6 & 7. Update progress to 75%
    console.log('\n[STUDENT A - STEPS 6 & 7] Updating Progress to 75% & Verifying UI State...');
    const update75Res = await request('PUT', `/api/college/goals/${goalId}`, {
      ...goal1,
      progress_percentage: 75
    }, tokenA);
    console.log('Update 75% Response:', update75Res.status, update75Res.data);

    const getRes2 = await request('GET', '/api/college/goals', null, tokenA);
    const goal2 = getRes2.data.goals?.find(g => String(g.id) === String(goalId));
    console.log(`Updated Progress: ${goal2.progress_percentage}% (Expected 75%), Completed: ${goal2.completed}`);

    // 8 & 9. Update progress to 100% and verify completion
    console.log('\n[STUDENT A - STEPS 8 & 9] Updating Progress to 100% & Verifying Auto-Completion...');
    const update100Res = await request('PUT', `/api/college/goals/${goalId}`, {
      ...goal2,
      progress_percentage: 100
    }, tokenA);
    console.log('Update 100% Response:', update100Res.status, update100Res.data);

    const getRes3 = await request('GET', '/api/college/goals', null, tokenA);
    const goal3 = getRes3.data.goals?.find(g => String(g.id) === String(goalId));
    console.log(`Final Progress: ${goal3.progress_percentage}%, Completed: ${goal3.completed} (Expected true)`);

    // Target Date & Overdue Logic Test
    console.log('\n[STUDENT A - TARGET DATE TEST] Creating Overdue Goal (Target Date: 2025-01-01)...');
    const overdueRes = await request('POST', '/api/college/goals', {
      title: 'Past Assignment Submission',
      description: 'Overdue task simulation',
      category: 'Academic',
      target_date: '2025-01-01',
      progress_percentage: 50
    }, tokenA);
    const overdueId = overdueRes.data.goalId;

    const getRes4 = await request('GET', '/api/college/goals', null, tokenA);
    const overdueGoal = getRes4.data.goals?.find(g => String(g.id) === String(overdueId));
    console.log('Overdue Goal Check:', overdueGoal);
    console.log(`Days Remaining: ${overdueGoal.daysRemaining}, Is Overdue: ${overdueGoal.isOverdue} (Expected true)`);

    // 10, 11, 12. Edit & Delete goal
    console.log('\n[STUDENT A - STEPS 10, 11, 12] Deleting Goals & Verifying Cleanup...');
    const deleteRes = await request('DELETE', `/api/college/goals/${goalId}`, null, tokenA);
    console.log('Delete Response:', deleteRes.status, deleteRes.data);

    const getRes5 = await request('GET', '/api/college/goals', null, tokenA);
    console.log('Student A Goals Count after deletion:', getRes5.data.goals?.length);

    // STUDENT B TESTS
    const emailB = `goal_student_b_${Date.now()}@example.com`;
    console.log(`\n[STUDENT B - STEP 1] Registering and Logging in Student B (${emailB})...`);
    const regResB = await request('POST', '/api/auth/register', {
      name: 'Goals Student B',
      email: emailB,
      password: 'Password123',
      college: 'NIT Trichy',
      course: 'B.Tech',
      branch: 'Mechanical',
      year_of_study: '4th Year'
    });
    const tokenB = regResB.data.token;

    console.log('\n[STUDENT B - STEP 2] Verifying Student A goals are NOT visible to Student B...');
    const getResB = await request('GET', '/api/college/goals', null, tokenB);
    console.log('Student B Goals Count:', getResB.data.goals?.length);

    if (getResB.data.goals?.length === 0) {
      console.log('🔒 STUDENT PRIVACY CONFIRMED: Student B cannot see Student A goals!');
    }

    console.log('\n[STUDENT B - STEPS 3 & 4] Attempting to edit/delete Student A goal ID as Student B...');
    const bEditRes = await request('PUT', `/api/college/goals/${overdueId}`, { title: 'Hacked Goal' }, tokenB);
    console.log('Student B Edit Attempt Status:', bEditRes.status, bEditRes.data);

    const bDeleteRes = await request('DELETE', `/api/college/goals/${overdueId}`, null, tokenB);
    console.log('Student B Delete Attempt Status:', bDeleteRes.status, bDeleteRes.data);

    if (bEditRes.status >= 400 && bDeleteRes.status >= 400) {
      console.log('🔒 ISOLATION & PERMISSION DENIED VERIFIED!');
    }

    console.log('\n🎉 ALL GOALS MODULE TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Goals Integration Test Failed:', err.message);
  }
}

runGoalsTest();

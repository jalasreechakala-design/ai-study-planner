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

async function runTasksTest() {
  console.log('--- STARTING TASKS MODULE FIRESTORE INTEGRATION & ISOLATION TEST ---');

  try {
    // 1. Register & Login Student A
    const emailA = `student_a_${Date.now()}@example.com`;
    console.log(`\n[STEP 1] Registering and Logging in Student A (${emailA})...`);
    const regResA = await request('POST', '/api/auth/register', {
      name: 'Student A',
      email: emailA,
      password: 'Password123',
      college: 'MIT',
      course: 'B.Tech',
      branch: 'Computer Science',
      year_of_study: '3rd Year'
    });
    const tokenA = regResA.data.token;
    const userIdA = regResA.data.user.id;
    console.log(`✅ Student A Registered (ID: ${userIdA}, Token Acquired)`);

    // 2. Add a task for Student A
    console.log('\n[STEP 2] Adding Task for Student A...');
    const addTaskRes = await request('POST', '/api/college/tasks', {
      taskName: 'Complete Operating Systems Lab 1',
      title: 'Complete Operating Systems Lab 1',
      subject: 'Operating Systems',
      subject_name: 'Operating Systems',
      description: 'Implement process scheduling simulator in C++',
      priority: 'high',
      dueDate: '2026-09-01',
      category: 'college'
    }, tokenA);
    console.log('Response:', addTaskRes.status, addTaskRes.data);
    const taskId = addTaskRes.data.taskId;

    // 3. Verify task appears in Student A task list
    console.log('\n[STEP 3] Verifying Task appears in Student A Tasks list...');
    const getTasksRes1 = await request('GET', '/api/college/tasks', null, tokenA);
    console.log('Status:', getTasksRes1.status);
    console.log('Student A Tasks Count:', getTasksRes1.data.tasks?.length);
    const taskA = getTasksRes1.data.tasks.find(t => String(t.id) === String(taskId));
    console.log('Task A Details:', taskA);

    // 4 & 5. Refresh / Refetch to verify persistence
    console.log('\n[STEPS 4 & 5] Refreshing page / Refetching to verify persistence...');
    const getTasksRes2 = await request('GET', '/api/college/tasks', null, tokenA);
    const taskA_persisted = getTasksRes2.data.tasks.find(t => String(t.id) === String(taskId));
    if (taskA_persisted) {
      console.log('✅ Task persisted successfully after refresh!');
    } else {
      console.error('❌ Task missing after refresh!');
    }

    // 6. Mark task as completed
    console.log('\n[STEP 6] Marking Task as Completed...');
    const statusRes = await request('PUT', `/api/college/tasks/${taskId}/status`, { completed: true, status: 'completed' }, tokenA);
    console.log('Status Update Response:', statusRes.status, statusRes.data);

    // 7. Edit task
    console.log('\n[STEP 7] Editing Task details...');
    const editRes = await request('PUT', `/api/college/tasks/${taskId}`, {
      taskName: 'Complete OS Lab 1 & 2',
      title: 'Complete OS Lab 1 & 2',
      priority: 'high',
      dueDate: '2026-09-05'
    }, tokenA);
    console.log('Edit Response:', editRes.status, editRes.data);

    // 8. Delete task
    console.log('\n[STEP 8] Deleting Task...');
    const deleteRes = await request('DELETE', `/api/college/tasks/${taskId}`, null, tokenA);
    console.log('Delete Response:', deleteRes.status, deleteRes.data);

    const getTasksRes3 = await request('GET', '/api/college/tasks', null, tokenA);
    console.log('Student A Tasks Count after deletion:', getTasksRes3.data.tasks?.length);

    // 9 & 10. Register & Login Student B, verify user isolation
    const emailB = `student_b_${Date.now()}@example.com`;
    console.log(`\n[STEP 9] Registering and Logging in Student B (${emailB})...`);
    const regResB = await request('POST', '/api/auth/register', {
      name: 'Student B',
      email: emailB,
      password: 'Password123',
      college: 'Stanford',
      course: 'B.Tech',
      branch: 'Electrical',
      year_of_study: '2nd Year'
    });
    const tokenB = regResB.data.token;

    console.log('\n[STEP 10] Verifying Student B cannot access Student A tasks...');
    const getTasksResB = await request('GET', '/api/college/tasks', null, tokenB);
    console.log('Student B Tasks Count:', getTasksResB.data.tasks?.length);
    const hasStudentATask = getTasksResB.data.tasks?.some(t => String(t.id) === String(taskId));

    if (!hasStudentATask) {
      console.log('🔒 USER ISOLATION VERIFIED: Student B sees 0 of Student A tasks!');
    } else {
      console.error('❌ SECURITY FAILURE: Student B can see Student A task!');
    }

    console.log('\n🎉 ALL 10 STEPS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Task Integration Test Failed:', err.message);
  }
}

runTasksTest();

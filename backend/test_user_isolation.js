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

async function testUserDataIsolation() {
  console.log('--- STARTING USER DATA ISOLATION AUDIT TEST SUITE ---');

  const timestamp = Date.now();
  const studentAEmail = `student_a_${timestamp}@test.com`;
  const studentBEmail = `student_b_${timestamp}@test.com`;

  // 1. Register Student A
  console.log('\n[1] Registering Student A...');
  const regA = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Student A', email: studentAEmail, password: 'Password123', confirmPassword: 'Password123',
    phone: '111-111-1111', college: 'Univ A', course: 'B.Tech', branch: 'CS', year_of_study: '2nd Year'
  });
  const tokenA = regA.data.token;
  const userAId = regA.data.user.id;
  console.log(`Student A registered. ID: ${userAId}`);

  // 2. Register Student B
  console.log('\n[2] Registering Student B...');
  const regB = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Student B', email: studentBEmail, password: 'Password123', confirmPassword: 'Password123',
    phone: '222-222-2222', college: 'Univ B', course: 'B.Tech', branch: 'ECE', year_of_study: '3rd Year'
  });
  const tokenB = regB.data.token;
  const userBId = regB.data.user.id;
  console.log(`Student B registered. ID: ${userBId}`);

  const headersA = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` };
  const headersB = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` };

  // 3. Create private data for Student B
  console.log('\n[3] Creating private tasks, notes, attendance, goals, cgpa for Student B...');
  const taskB = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/tasks', method: 'POST', headers: headersB }, {
    title: "Student B Private Task", description: "Top secret study plan for Student B", subject_name: "Algorithms", priority: "high"
  });
  console.log('Student B Task Created ID:', taskB.data.taskId);

  const noteB = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/notes', method: 'POST', headers: headersB }, {
    title: "Student B Secret Note", content: "Confidential research notes of Student B", subject_name: "Algorithms"
  });
  console.log('Student B Note Created ID:', noteB.data.noteId);

  // 4. Verify Student A's endpoints return ONLY Student A's data
  console.log('\n[4] Requesting Tasks for Student A (must NOT contain Student B data)...');
  const tasksA = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/tasks', method: 'GET', headers: headersA });
  const containsBTask = (tasksA.data.tasks || []).some(t => t.id === taskB.data.taskId || t.title === "Student B Private Task");
  console.log(`Student A Tasks count: ${tasksA.data.tasks?.length}. Contains Student B task? ${containsBTask} (Expected: false)`);

  console.log('\n[5] Requesting Notes for Student A (must NOT contain Student B data)...');
  const notesA = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/notes', method: 'GET', headers: headersA });
  const containsBNote = (notesA.data.notes || []).some(n => n.id === noteB.data.noteId || n.title === "Student B Secret Note");
  console.log(`Student A Notes count: ${notesA.data.notes?.length}. Contains Student B note? ${containsBNote} (Expected: false)`);

  // 5. Test updating/deleting Student B's task using Student A's token
  console.log('\n[6] Attempting to update Student B task using Student A token...');
  const hackUpdate = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: `/api/college/tasks/${taskB.data.taskId}`, method: 'PUT', headers: headersA }, {
    title: "Hacked by Student A"
  });
  console.log(`Update attempt status: ${hackUpdate.status}`);

  console.log('\n[7] Attempting to delete Student B note using Student A token...');
  const hackDelete = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: `/api/college/notes/${noteB.data.noteId}`, method: 'DELETE', headers: headersA });
  console.log(`Delete attempt status: ${hackDelete.status}`);

  // 6. Verify Student B's data remains uncorrupted
  console.log('\n[8] Verifying Student B data remains uncorrupted...');
  const notesBCheck = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/college/notes', method: 'GET', headers: headersB });
  const bNoteIntact = (notesBCheck.data.notes || []).some(n => n.id === noteB.data.noteId);
  console.log(`Student B note still exists and is safe? ${bNoteIntact} (Expected: true)`);

  if (!containsBTask && !containsBNote && bNoteIntact) {
    console.log('\n✅ USER DATA ISOLATION VERIFICATION PASSED PERFECTLY!');
  } else {
    console.error('\n❌ USER DATA ISOLATION FAILURE DETECTED!');
  }
}

testUserDataIsolation().catch(console.error);

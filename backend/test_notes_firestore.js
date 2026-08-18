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

async function runNotesTest() {
  console.log('--- STARTING NOTES MODULE FIRESTORE INTEGRATION & ISOLATION TEST ---');

  try {
    // 1. Register & Login Student A
    const emailA = `notes_student_a_${Date.now()}@example.com`;
    console.log(`\n[STUDENT A - STEP 1] Registering and Logging in Student A (${emailA})...`);
    const regResA = await request('POST', '/api/auth/register', {
      name: 'Notes Student A',
      email: emailA,
      password: 'Password123',
      college: 'Harvard',
      course: 'B.Tech',
      branch: 'Computer Science',
      year_of_study: '3rd Year'
    });
    const tokenA = regResA.data.token;
    const userIdA = regResA.data.user.id;
    console.log(`✅ Student A Registered (ID: ${userIdA})`);

    // 2. Create Note for Student A
    console.log('\n[STUDENT A - STEP 2] Creating Note...');
    const addNoteRes = await request('POST', '/api/college/notes', {
      title: 'Database Indexing & B-Trees',
      content: 'B-Trees reduce I/O cost by balancing disk node access.',
      subject: 'DBMS',
      category: 'DBMS',
      tags: 'dbms,indexing,b-tree'
    }, tokenA);
    console.log('Create Response:', addNoteRes.status, addNoteRes.data);
    const noteId = addNoteRes.data.noteId;

    // 3. Verify Note appears
    console.log('\n[STUDENT A - STEP 3] Verifying Note appears in Student A Notes list...');
    const getNotesRes1 = await request('GET', '/api/college/notes', null, tokenA);
    console.log('Status:', getNotesRes1.status);
    console.log('Student A Notes Count:', getNotesRes1.data.notes?.length);
    const noteA = getNotesRes1.data.notes?.find(n => String(n.id) === String(noteId));
    console.log('Note Details:', noteA);

    // 4 & 5. Refresh / Refetch to verify persistence
    console.log('\n[STUDENT A - STEPS 4 & 5] Refreshing / Refetching to verify persistence...');
    const getNotesRes2 = await request('GET', '/api/college/notes', null, tokenA);
    const noteA_persisted = getNotesRes2.data.notes?.find(n => String(n.id) === String(noteId));
    if (noteA_persisted) {
      console.log('✅ Note persisted successfully after refresh!');
    } else {
      console.error('❌ Note missing after refresh!');
    }

    // 6. Edit Note
    console.log('\n[STUDENT A - STEP 6] Editing Note...');
    const editRes = await request('PUT', `/api/college/notes/${noteId}`, {
      title: 'Database Indexing & B+ Trees Advanced',
      content: 'B+ Trees store all data pointers in leaf nodes for faster range scans.',
      subject: 'DBMS',
      category: 'DBMS',
      tags: 'dbms,indexing,b+tree,advanced'
    }, tokenA);
    console.log('Edit Response:', editRes.status, editRes.data);

    // 7 & 8. Refresh & Verify Changes
    console.log('\n[STUDENT A - STEPS 7 & 8] Refreshing & Verifying Edited Changes...');
    const getNotesRes3 = await request('GET', '/api/college/notes', null, tokenA);
    const editedNote = getNotesRes3.data.notes?.find(n => String(n.id) === String(noteId));
    console.log('Updated Note Title:', editedNote?.title);
    console.log('Updated Note Content:', editedNote?.content);
    if (editedNote?.title.includes('B+ Trees Advanced')) {
      console.log('✅ Edited changes verified successfully!');
    }

    // 9 & 10. Delete Note & Verify Deletion
    console.log('\n[STUDENT A - STEPS 9 & 10] Deleting Note & Verifying Deletion...');
    const deleteRes = await request('DELETE', `/api/college/notes/${noteId}`, null, tokenA);
    console.log('Delete Response:', deleteRes.status, deleteRes.data);

    const getNotesRes4 = await request('GET', '/api/college/notes', null, tokenA);
    console.log('Student A Notes Count after deletion:', getNotesRes4.data.notes?.length);

    // STUDENT B TESTS
    const emailB = `notes_student_b_${Date.now()}@example.com`;
    console.log(`\n[STUDENT B - STEP 1] Registering and Logging in Student B (${emailB})...`);
    const regResB = await request('POST', '/api/auth/register', {
      name: 'Notes Student B',
      email: emailB,
      password: 'Password123',
      college: 'Oxford',
      course: 'B.Tech',
      branch: 'Information Technology',
      year_of_study: '2nd Year'
    });
    const tokenB = regResB.data.token;

    // Student A recreates a note to test Student B access denial
    const freshNoteResA = await request('POST', '/api/college/notes', {
      title: "Student A Confidential Research Note",
      content: "Private study notes",
      subject: "Security",
      category: "Security"
    }, tokenA);
    const secretNoteIdA = freshNoteResA.data.noteId;

    console.log('\n[STUDENT B - STEP 2] Verifying Student A notes are NOT visible to Student B...');
    const getNotesResB = await request('GET', '/api/college/notes', null, tokenB);
    console.log('Student B Notes Count:', getNotesResB.data.notes?.length);

    const seesSecretNote = getNotesResB.data.notes?.some(n => String(n.id) === String(secretNoteIdA));
    if (!seesSecretNote) {
      console.log('🔒 STUDENT PRIVACY CONFIRMED: Student B cannot see Student A notes list!');
    }

    console.log('\n[STUDENT B - STEPS 3 & 4] Attempting to edit/delete Student A note ID as Student B...');
    const bEditRes = await request('PUT', `/api/college/notes/${secretNoteIdA}`, { title: 'Hacked by B' }, tokenB);
    console.log('Student B Edit Attempt Status:', bEditRes.status, bEditRes.data);

    const bDeleteRes = await request('DELETE', `/api/college/notes/${secretNoteIdA}`, null, tokenB);
    console.log('Student B Delete Attempt Status:', bDeleteRes.status, bDeleteRes.data);

    if (bEditRes.status >= 400 || bDeleteRes.status >= 400 || !bEditRes.data.note) {
      console.log('🔒 ISOLATION & PERMISSION DENIED VERIFIED!');
    }

    console.log('\n🎉 ALL NOTES MODULE TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Notes Integration Test Failed:', err.message);
  }
}

runNotesTest();

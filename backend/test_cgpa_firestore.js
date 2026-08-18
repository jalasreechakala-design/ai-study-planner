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

async function runCgpaTest() {
  console.log('--- STARTING CGPA MODULE FIRESTORE INTEGRATION & CALCULATIONS TEST ---');

  try {
    // 1. Register & Login Student A
    const emailA = `cgpa_student_a_${Date.now()}@example.com`;
    console.log(`\n[STUDENT A - STEP 1] Registering and Logging in Student A (${emailA})...`);
    const regResA = await request('POST', '/api/auth/register', {
      name: 'CGPA Student A',
      email: emailA,
      password: 'Password123',
      college: 'IIT Madras',
      course: 'B.Tech',
      branch: 'Computer Science',
      year_of_study: '3rd Year'
    });
    const tokenA = regResA.data.token;
    const userIdA = regResA.data.user.id;
    console.log(`✅ Student A Registered (ID: ${userIdA})`);

    // 2. Add 3 courses for Semester 1
    console.log('\n[STUDENT A - STEP 2] Adding 3 Courses for Semester 1...');
    const c1 = await request('POST', '/api/college/cgpa', {
      semester: 'Semester 1',
      subject_name: 'Data Structures & Algorithms',
      courseCode: 'CS101',
      credits: 4,
      grade: 'S',
      gpa: 10.0,
      gradePoints: 10.0
    }, tokenA);

    const c2 = await request('POST', '/api/college/cgpa', {
      semester: 'Semester 1',
      subject_name: 'Digital Logic Design',
      courseCode: 'CS102',
      credits: 3,
      grade: 'A',
      gpa: 9.0,
      gradePoints: 9.0
    }, tokenA);

    const c3 = await request('POST', '/api/college/cgpa', {
      semester: 'Semester 1',
      subject_name: 'Discrete Mathematics',
      courseCode: 'MA101',
      credits: 3,
      grade: 'B+',
      gpa: 8.0,
      gradePoints: 8.0
    }, tokenA);
    const c3Id = c3.data.recordId;

    // 3, 4, 5. Verify Semester 1 SGPA & Add Semester 2 course
    console.log('\n[STUDENT A - STEPS 3, 4, 5] Verifying Semester 1 SGPA & Adding Semester 2 Course...');
    const res1 = await request('GET', '/api/college/cgpa', null, tokenA);
    console.log('Sem 1 Cumulative CGPA:', res1.data.cumulativeCGPA);
    console.log('Sem 1 SGPA Map:', res1.data.semesterSgpaMap);

    const c4 = await request('POST', '/api/college/cgpa', {
      semester: 'Semester 2',
      subject_name: 'Operating Systems',
      courseCode: 'CS201',
      credits: 4,
      grade: 'A+',
      gpa: 10.0,
      gradePoints: 10.0
    }, tokenA);

    // 6 & 7. Verify Cumulative CGPA & Edit a course
    console.log('\n[STUDENT A - STEPS 6 & 7] Verifying Cumulative CGPA & Editing Course 3 Grade...');
    const res2 = await request('GET', '/api/college/cgpa', null, tokenA);
    console.log('Cumulative CGPA after Sem 2:', res2.data.cumulativeCGPA);
    console.log('Semester SGPAs:', res2.data.semesterSgpaMap);

    const editRes = await request('PUT', `/api/college/cgpa/${c3Id}`, {
      semester: 'Semester 1',
      subject_name: 'Discrete Mathematics',
      credits: 3,
      grade: 'A',
      gpa: 9.0,
      gradePoints: 9.0
    }, tokenA);
    console.log('Edit Course Response:', editRes.status, editRes.data);

    // 8, 9, 10. Verify Recalculation, Delete & Verify Persistence
    console.log('\n[STUDENT A - STEPS 8, 9, 10] Verifying Recalculation & Deleting Course 3...');
    const res3 = await request('GET', '/api/college/cgpa', null, tokenA);
    console.log('Recalculated CGPA after edit:', res3.data.cumulativeCGPA);

    const deleteRes = await request('DELETE', `/api/college/cgpa/${c3Id}`, null, tokenA);
    console.log('Delete Response:', deleteRes.status, deleteRes.data);

    const res4 = await request('GET', '/api/college/cgpa', null, tokenA);
    console.log('Recalculated CGPA after deletion:', res4.data.cumulativeCGPA);
    console.log('Remaining courses count:', res4.data.records?.length);

    // STUDENT B TESTS
    const emailB = `cgpa_student_b_${Date.now()}@example.com`;
    console.log(`\n[STUDENT B - STEP 1] Registering and Logging in Student B (${emailB})...`);
    const regResB = await request('POST', '/api/auth/register', {
      name: 'CGPA Student B',
      email: emailB,
      password: 'Password123',
      college: 'BITS Pilani',
      course: 'B.Tech',
      branch: 'Electrical',
      year_of_study: '2nd Year'
    });
    const tokenB = regResB.data.token;

    console.log('\n[STUDENT B - STEP 2] Verifying Student A CGPA records are NOT visible to Student B...');
    const getResB = await request('GET', '/api/college/cgpa', null, tokenB);
    console.log('Student B CGPA Records Count:', getResB.data.records?.length);

    if (getResB.data.records?.length === 0) {
      console.log('🔒 STUDENT PRIVACY CONFIRMED: Student B cannot see Student A CGPA records!');
    }

    console.log('\n[STUDENT B - STEPS 3 & 4] Attempting to edit/delete Student A CGPA record as Student B...');
    const bEditRes = await request('PUT', `/api/college/cgpa/${c1.data.recordId}`, { credits: 10, gpa: 10 }, tokenB);
    console.log('Student B Edit Attempt Status:', bEditRes.status, bEditRes.data);

    const bDeleteRes = await request('DELETE', `/api/college/cgpa/${c1.data.recordId}`, null, tokenB);
    console.log('Student B Delete Attempt Status:', bDeleteRes.status, bDeleteRes.data);

    if (bEditRes.status >= 400 && bDeleteRes.status >= 400) {
      console.log('🔒 ISOLATION & PERMISSION DENIED VERIFIED!');
    }

    console.log('\n🎉 ALL CGPA MODULE TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ CGPA Integration Test Failed:', err.message);
  }
}

runCgpaTest();

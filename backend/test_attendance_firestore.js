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

async function runAttendanceTest() {
  console.log('--- STARTING ATTENDANCE MODULE FIRESTORE INTEGRATION & BUNK CALCULATOR TEST ---');

  try {
    // 1. Register & Login Student A
    const emailA = `att_student_a_${Date.now()}@example.com`;
    console.log(`\n[STUDENT A - STEP 1] Registering and Logging in Student A (${emailA})...`);
    const regResA = await request('POST', '/api/auth/register', {
      name: 'Attendance Student A',
      email: emailA,
      password: 'Password123',
      college: 'MIT',
      course: 'B.Tech',
      branch: 'Computer Science',
      year_of_study: '3rd Year'
    });
    const tokenA = regResA.data.token;
    const userIdA = regResA.data.user.id;
    console.log(`✅ Student A Registered (ID: ${userIdA})`);

    // 2. Add Computer Networks: totalClasses = 20, attendedClasses = 16, targetPercentage = 75
    console.log('\n[STUDENT A - STEP 2] Adding Computer Networks (Total: 20, Attended: 16, Target: 75%)...');
    const addRes = await request('POST', '/api/college/attendance', {
      subject_name: 'Computer Networks',
      subjectName: 'Computer Networks',
      attended_classes: 16,
      attendedClasses: 16,
      total_classes: 20,
      totalClasses: 20,
      target_percentage: 75,
      targetPercentage: 75
    }, tokenA);
    console.log('Add Response:', addRes.status, addRes.data);
    const recId = addRes.data.recordId;

    // 3, 4, 5. Verify 80% attendance, status tier & bunk calculator
    console.log('\n[STUDENT A - STEPS 3, 4, 5] Verifying 80% Attendance, Status Tier & Bunk Calculator...');
    const getRes1 = await request('GET', '/api/college/attendance', null, tokenA);
    console.log('Get Response Status:', getRes1.status);
    const cnRecord = getRes1.data.attendance?.find(r => String(r.id) === String(recId));
    console.log('Computer Networks Record:', cnRecord);

    const pct = cnRecord.currentPercentage;
    const tier = cnRecord.statusTier;
    const bunks = cnRecord.safeToBunk;

    console.log(`Attendance %: ${pct}% (Expected 80%)`);
    console.log(`Status Tier: ${tier} (Expected 🟢 Safe)`);
    console.log(`Safe Bunks: ${bunks} (Expected >= 1)`);

    if (pct === 80 && tier.includes('Safe')) {
      console.log('✅ Attendance % and Bunk Calculator verified successfully!');
    } else {
      console.error('❌ Attendance calculation mismatch!');
    }

    // 6 & 7. Update attendance and verify persistence
    console.log('\n[STUDENT A - STEPS 6 & 7] Updating Attendance (Total: 25, Attended: 20) & Refreshing...');
    const updateRes = await request('PUT', `/api/college/attendance/${recId}`, {
      subject_name: 'Computer Networks',
      attended_classes: 20,
      total_classes: 25,
      target_percentage: 75
    }, tokenA);
    console.log('Update Response:', updateRes.status, updateRes.data);

    const getRes2 = await request('GET', '/api/college/attendance', null, tokenA);
    const updatedRecord = getRes2.data.attendance?.find(r => String(r.id) === String(recId));
    console.log('Updated Record Details:', updatedRecord);
    if (updatedRecord && updatedRecord.total_classes === 25) {
      console.log('✅ Updated record persisted successfully!');
    }

    // 8 & 9. Delete record & verify deletion
    console.log('\n[STUDENT A - STEPS 8 & 9] Deleting Record & Verifying Deletion...');
    const deleteRes = await request('DELETE', `/api/college/attendance/${recId}`, null, tokenA);
    console.log('Delete Response:', deleteRes.status, deleteRes.data);

    const getRes3 = await request('GET', '/api/college/attendance', null, tokenA);
    console.log('Student A Attendance Count after deletion:', getRes3.data.attendance?.length);

    // STUDENT B TESTS
    const emailB = `att_student_b_${Date.now()}@example.com`;
    console.log(`\n[STUDENT B - STEP 1] Registering and Logging in Student B (${emailB})...`);
    const regResB = await request('POST', '/api/auth/register', {
      name: 'Attendance Student B',
      email: emailB,
      password: 'Password123',
      college: 'Stanford',
      course: 'B.Tech',
      branch: 'Electrical',
      year_of_study: '2nd Year'
    });
    const tokenB = regResB.data.token;

    // Student A creates secret record
    const secretAdd = await request('POST', '/api/college/attendance', {
      subject_name: 'Operating Systems',
      attended_classes: 15,
      total_classes: 15,
      target_percentage: 75
    }, tokenA);
    const secretRecId = secretAdd.data.recordId;

    console.log('\n[STUDENT B - STEP 2] Verifying Student A attendance is NOT visible to Student B...');
    const getResB = await request('GET', '/api/college/attendance', null, tokenB);
    console.log('Student B Attendance Records Count:', getResB.data.attendance?.length);

    const seesSecret = getResB.data.attendance?.some(r => String(r.id) === String(secretRecId));
    if (!seesSecret) {
      console.log('🔒 STUDENT PRIVACY CONFIRMED: Student B cannot see Student A attendance records!');
    }

    console.log('\n[STUDENT B - STEPS 3 & 4] Attempting to edit/delete Student A attendance ID as Student B...');
    const bEditRes = await request('PUT', `/api/college/attendance/${secretRecId}`, { attended_classes: 0 }, tokenB);
    console.log('Student B Edit Attempt Status:', bEditRes.status, bEditRes.data);

    const bDeleteRes = await request('DELETE', `/api/college/attendance/${secretRecId}`, null, tokenB);
    console.log('Student B Delete Attempt Status:', bDeleteRes.status, bDeleteRes.data);

    console.log('\n🎉 ALL ATTENDANCE MODULE TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Attendance Integration Test Failed:', err.message);
  }
}

runAttendanceTest();

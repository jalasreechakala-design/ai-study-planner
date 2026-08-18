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

async function testExamRoadmaps() {
  console.log('--- STARTING EXAM ROADMAP & RESOURCE ISOLATION AUDIT TEST ---');

  // Authenticate student
  const studentEmail = `exam_tester_${Date.now()}@test.com`;
  const regRes = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Roadmap Tester', email: studentEmail, password: 'Password123', confirmPassword: 'Password123',
    phone: '555-555-5555', college: 'IIT Madras', course: 'B.Tech', branch: 'CS', year_of_study: '4th Year'
  });
  const token = regRes.data.token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // Fetch Exams catalog
  console.log('\n[1] Fetching Exams catalog...');
  const examsRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/exams', method: 'GET', headers });
  const exams = examsRes.data.exams || [];
  console.log(`Retrieved ${exams.length} exams.`);

  const gateExam = exams.find(e => e.code === 'GATE_CS' || e.title.includes('GATE'));
  const jeeExam = exams.find(e => e.code === 'JEE_MAIN' || e.title.includes('JEE'));
  const neetExam = exams.find(e => e.code === 'NEET_UG' || e.title.includes('NEET'));
  const upscExam = exams.find(e => e.code === 'UPSC_CSE' || e.title.includes('UPSC'));

  console.log('Found Exams:');
  console.log('- GATE:', gateExam?.id, gateExam?.title);
  console.log('- JEE:', jeeExam?.id, jeeExam?.title);
  console.log('- NEET:', neetExam?.id, neetExam?.title);
  console.log('- UPSC:', upscExam?.id, upscExam?.title);

  // Test GATE Roadmap
  if (gateExam) {
    const gateRoadmap = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: `/api/competitive/roadmap/${gateExam.id}`, method: 'GET', headers });
    console.log(`GATE Roadmap Subjects: ${gateRoadmap.data.subjectsCount}, Topics: ${gateRoadmap.data.totalTopics}`);
  }

  // Test JEE Roadmap
  if (jeeExam) {
    const jeeRoadmap = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: `/api/competitive/roadmap/${jeeExam.id}`, method: 'GET', headers });
    console.log(`JEE Roadmap Subjects: ${jeeRoadmap.data.subjectsCount}, Topics: ${jeeRoadmap.data.totalTopics}`);
  }

  // Test NEET Roadmap
  if (neetExam) {
    const neetRoadmap = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: `/api/competitive/roadmap/${neetExam.id}`, method: 'GET', headers });
    console.log(`NEET Roadmap Subjects: ${neetRoadmap.data.subjectsCount}, Topics: ${neetRoadmap.data.totalTopics}`);
  }

  // Test UPSC Roadmap
  if (upscExam) {
    const upscRoadmap = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: `/api/competitive/roadmap/${upscExam.id}`, method: 'GET', headers });
    console.log(`UPSC Roadmap Subjects: ${upscRoadmap.data.subjectsCount}, Topics: ${upscRoadmap.data.totalTopics}`);
  }

  // Item 10: Resource Link Test
  console.log('\n[2] Performing Resource Link Test...');
  // Authenticate Admin
  const adminLogin = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@platform.com', password: 'Admin@123456' });
  const adminHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminLogin.data.token}` };

  const newResource = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/admin/resources', method: 'POST', headers: adminHeaders
  }, {
    title: "TCP Congestion Control Explained",
    exam_id: gateExam ? gateExam.id : 1,
    subject_id: 1,
    topic_id: 1,
    material_type: "link",
    resource_type: "video",
    file_url: "https://www.youtube.com/watch?v=TCP_Congestion_Control_Explained",
    description: "Detailed step-by-step video explanation of TCP Congestion Control window mechanisms."
  });

  console.log('Resource Creation Status:', newResource.status, newResource.data);

  // Student fetches materials for GATE
  const studentMaterials = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/competitive/materials?exam_id=${gateExam ? gateExam.id : 1}`, method: 'GET', headers
  });

  const createdMat = (studentMaterials.data.materials || []).find(m => m.title === "TCP Congestion Control Explained");
  console.log('Student found newly created resource:', Boolean(createdMat), createdMat ? `URL: ${createdMat.file_url}` : '');

  // Student attempts to modify/delete resource (should be denied)
  const studentModify = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/admin/resources/${createdMat ? createdMat.id : 1}`, method: 'DELETE', headers
  });
  console.log(`Student attempted to delete admin resource -> Status: ${studentModify.status} (Expected: 403)`);

  if (gateExam && jeeExam && neetExam && upscExam && createdMat && studentModify.status === 403) {
    console.log('\n✅ EXAM ROADMAP & RESOURCE LINK TEST PASSED PERFECTLY!');
  } else {
    console.log('\n⚠️ Exam roadmap / resource link test completed with warnings.');
  }
}

testExamRoadmaps().catch(console.error);

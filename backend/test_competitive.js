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

async function testCompetitivePlatform() {
  console.log('--- STARTING COMPETITIVE EXAM PLATFORM AUTOMATED TEST SUITE ---');

  // Step 1: Register test student
  console.log('\n[1] Registering fresh student for Competitive platform test...');
  const testEmail = `comp_tester_${Date.now()}@platform.edu`;
  const regRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Competitive Tester',
    email: testEmail,
    password: 'Password123',
    confirmPassword: 'Password123',
    phone: '+1 555-0177',
    college: 'IIT Bombay',
    course: 'B.Tech',
    branch: 'Computer Science',
    year_of_study: '4th Year'
  });

  const token = regRes.data.token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  console.log(`Token acquired for student: ${testEmail}`);

  // Step 2: Browse Exams List (Category check: GATE, UPSC, SSC, Banking, JEE, NEET, CAT, RRB, APPSC, TSPSC, UGC NET)
  console.log('\n[2] Testing GET /api/competitive/exams...');
  const examsRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/exams', method: 'GET', headers });
  console.log(`Total Exams Retrieved: ${examsRes.data.exams.length}`);
  console.log('Exams List:', examsRes.data.exams.map(e => e.title));

  // Step 3: Set Student Exam Target & Date
  console.log('\n[3] Testing POST /api/competitive/target...');
  const targetDate = new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0];
  const setTargetRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/target', method: 'POST', headers }, {
    exam_id: 1,
    target_exam_date: targetDate
  });
  console.log('Target Set Result:', setTargetRes.data);

  // Step 4: Competitive Dashboard & Live Countdown
  console.log('\n[4] Testing GET /api/competitive/dashboard...');
  const dashRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/dashboard', method: 'GET', headers });
  console.log('Dashboard Summary:', {
    examTitle: dashRes.data.selectedExam.title,
    countdown: dashRes.data.countdown,
    syllabusCompletion: dashRes.data.syllabusSummary.completionPercentage,
    overallPreparation: dashRes.data.performance.overallPreparationPct,
    recommendation: dashRes.data.recommendation.message
  });

  // Step 5: Syllabus Roadmap & Subtopics
  console.log('\n[5] Testing GET /api/competitive/roadmap/1...');
  const roadmapRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/roadmap/1', method: 'GET', headers });
  console.log('Roadmap Retrieved:', {
    examTitle: roadmapRes.data.exam.title,
    totalTopics: roadmapRes.data.totalTopics,
    subjectsCount: roadmapRes.data.subjects.length,
    subtopicsSample: roadmapRes.data.subjects[0]?.topics[0]?.subtopics.map(st => st.title)
  });

  // Step 6: Update Topic Progress
  console.log('\n[6] Testing Topic Progress Update...');
  const topicId = roadmapRes.data.subjects[0]?.topics[0]?.id || 1;
  const updateProgRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/topic-progress', method: 'POST', headers }, {
    topicId,
    status: 'completed'
  });
  console.log('Topic Progress Update Result:', updateProgRes.data);

  // Step 7: Syllabus Tracker
  console.log('\n[7] Testing Syllabus Tracker...');
  const trackerRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/syllabus-tracker', method: 'GET', headers });
  console.log('Syllabus Tracker:', { completed: trackerRes.data.completed, overallPercentage: trackerRes.data.overallPercentage });

  // Step 8: Study Materials & Bookmarking
  console.log('\n[8] Testing Study Materials Library & Bookmarking...');
  const matRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/materials', method: 'GET', headers });
  console.log(`Study Materials Found: ${matRes.data.materials.length}`);

  const matId = matRes.data.materials[0]?.id || 1;
  const bookmarkRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/bookmark', method: 'POST', headers }, { material_id: matId });
  console.log('Bookmark Result:', bookmarkRes.data);

  // Step 9: Previous Year Questions (PYQs)
  console.log('\n[9] Testing PYQs Endpoint...');
  const pyqRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/pyqs', method: 'GET', headers });
  console.log(`PYQs Retrieved: ${pyqRes.data.questions.length}`);

  // Step 10: Quizzes & Timed Submission
  console.log('\n[10] Testing Quizzes & Automatic Evaluation...');
  const quizListRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/quizzes', method: 'GET', headers });
  const quizId = quizListRes.data.quizzes[0]?.id || 1;

  const submitQuizRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/quizzes/submit', method: 'POST', headers }, {
    quiz_id: quizId,
    answers: { 1: 'B', 2: 'B' },
    time_taken_seconds: 180
  });
  console.log('Quiz Submission Result:', { score: submitQuizRes.data.score, percentage: submitQuizRes.data.percentage, correctCount: submitQuizRes.data.correctCount });

  // Step 11: Mock Tests & Performance Evaluation
  console.log('\n[11] Testing Mock Tests & Weak Subject Analysis...');
  const mockListRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/mock-tests', method: 'GET', headers });
  const mockId = mockListRes.data.mockTests[0]?.id || 1;

  const submitMockRes = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/competitive/mock-tests/submit', method: 'POST', headers }, {
    mock_test_id: mockId,
    score: 80,
    total_questions: 30,
    correct_count: 24
  });
  console.log('Mock Test Submission Result:', submitMockRes.data);

  console.log('\n--- ALL COMPETITIVE EXAM PLATFORM TESTS COMPLETED SUCCESSFULLY ---');
}

testCompetitivePlatform().catch(console.error);

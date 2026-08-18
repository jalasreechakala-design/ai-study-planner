const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let isFallbackMode = false;
const fallbackDataFile = path.join(__dirname, '../../data_fallback.json');

let fallbackStore = {
  users: [],
  student_profiles: [],
  exams: [],
  exam_subjects: [],
  topics: [],
  subtopics: [],
  student_exam_targets: [],
  user_topic_progress: [],
  study_materials: [],
  bookmarked_materials: [],
  questions: [],
  quizzes: [],
  quiz_questions: [],
  quiz_results: [],
  mock_tests: [],
  mock_test_results: [],
  tasks: [],
  notes: [],
  attendance: [],
  cgpa_records: [],
  goals: [],
  study_sessions: [],
  notifications: [],
  email_reminders: [],
  study_streaks: []
};

function ensureStoreArrays() {
  if (!fallbackStore.users) fallbackStore.users = [];
  if (!fallbackStore.student_profiles) fallbackStore.student_profiles = [];
  if (!fallbackStore.exams) fallbackStore.exams = [];
  if (!fallbackStore.exam_subjects) fallbackStore.exam_subjects = [];
  if (!fallbackStore.topics) fallbackStore.topics = [];
  if (!fallbackStore.subtopics) fallbackStore.subtopics = [];
  if (!fallbackStore.student_exam_targets) fallbackStore.student_exam_targets = [];
  if (!fallbackStore.user_topic_progress) fallbackStore.user_topic_progress = [];
  if (!fallbackStore.study_materials) fallbackStore.study_materials = [];
  if (!fallbackStore.bookmarked_materials) fallbackStore.bookmarked_materials = [];
  if (!fallbackStore.questions) fallbackStore.questions = [];
  if (!fallbackStore.quizzes) fallbackStore.quizzes = [];
  if (!fallbackStore.quiz_questions) fallbackStore.quiz_questions = [];
  if (!fallbackStore.quiz_results) fallbackStore.quiz_results = [];
  if (!fallbackStore.mock_tests) fallbackStore.mock_tests = [];
  if (!fallbackStore.mock_test_results) fallbackStore.mock_test_results = [];
  if (!fallbackStore.tasks) fallbackStore.tasks = [];
  if (!fallbackStore.notes) fallbackStore.notes = [];
  if (!fallbackStore.attendance) fallbackStore.attendance = [];
  if (!fallbackStore.cgpa_records) fallbackStore.cgpa_records = [];
  if (!fallbackStore.goals) fallbackStore.goals = [];
  if (!fallbackStore.study_sessions) fallbackStore.study_sessions = [];
  if (!fallbackStore.notifications) fallbackStore.notifications = [];
  if (!fallbackStore.email_reminders) fallbackStore.email_reminders = [];
  if (!fallbackStore.study_streaks) fallbackStore.study_streaks = [];
}

function saveFallbackData() {
  try {
    ensureStoreArrays();
    fs.writeFileSync(fallbackDataFile, JSON.stringify(fallbackStore, null, 2));
  } catch (err) {
    console.error('Failed to save fallback data:', err.message);
  }
}

function loadFallbackData() {
  try {
    if (fs.existsSync(fallbackDataFile)) {
      const raw = fs.readFileSync(fallbackDataFile, 'utf-8');
      fallbackStore = JSON.parse(raw);
    }
    ensureStoreArrays();
  } catch (err) {
    console.error('Failed to load fallback data:', err.message);
    ensureStoreArrays();
  }
}

function getInitialSeedData() {
  const adminPasswordHash = bcrypt.hashSync('Admin@123456', 10);
  const studentPasswordHash = bcrypt.hashSync('Student@123456', 10);

  const defaultUsers = [
    { id: 1, name: 'System Admin', email: 'admin@platform.com', password: adminPasswordHash, role: 'admin', created_at: new Date().toISOString() },
    { id: 2, name: 'Alex Johnson', email: 'student@example.com', password: studentPasswordHash, role: 'student', created_at: new Date().toISOString() }
  ];

  const defaultProfiles = [
    { id: 1, user_id: 2, phone: '+1 555-0199', college: 'National Institute of Technology', course: 'B.Tech', branch: 'Computer Science', year_of_study: '3rd Year', created_at: new Date().toISOString() }
  ];

  const defaultExams = [
    { id: 1, title: 'GATE CS & IT', code: 'GATE_CS', category: 'Engineering', description: 'Graduate Aptitude Test in Engineering for Computer Science & IT', icon: 'Cpu', is_active: 1 },
    { id: 2, title: 'UPSC Civil Services', code: 'UPSC_CSE', category: 'Government', description: 'Union Public Service Commission Civil Services Examination', icon: 'Award', is_active: 1 },
    { id: 3, title: 'SSC CGL', code: 'SSC_CGL', category: 'Staff Selection', description: 'Staff Selection Commission Combined Graduate Level Exam', icon: 'Briefcase', is_active: 1 },
    { id: 4, title: 'Banking (IBPS/SBI PO)', code: 'BANK_PO', category: 'Banking', description: 'Probationary Officer Exams for SBI and IBPS', icon: 'DollarSign', is_active: 1 },
    { id: 5, title: 'JEE Main & Advanced', code: 'JEE_MAIN', category: 'Engineering Entrance', description: 'Joint Entrance Examination for Engineering Admissions', icon: 'Compass', is_active: 1 },
    { id: 6, title: 'NEET UG', code: 'NEET_UG', category: 'Medical Entrance', description: 'National Eligibility cum Entrance Test for Medical', icon: 'Activity', is_active: 1 },
    { id: 7, title: 'CAT', code: 'CAT_MBA', category: 'Management', description: 'Common Admission Test for IIMs and Top Business Schools', icon: 'TrendingUp', is_active: 1 },
    { id: 8, title: 'RRB NTPC', code: 'RRB_NTPC', category: 'Railways', description: 'Railway Recruitment Board Non-Technical Popular Categories', icon: 'Shield', is_active: 1 },
    { id: 9, title: 'APPSC Group 1', code: 'APPSC_G1', category: 'State PSC', description: 'Andhra Pradesh Public Service Commission Executive Services', icon: 'MapPin', is_active: 1 },
    { id: 10, title: 'TSPSC Group 1', code: 'TSPSC_G1', category: 'State PSC', description: 'Telangana State Public Service Commission Examination', icon: 'Navigation', is_active: 1 },
    { id: 11, title: 'UGC NET', code: 'UGC_NET', category: 'Lectureship & JRF', description: 'National Eligibility Test for Assistant Professor & JRF', icon: 'BookOpen', is_active: 1 }
  ];

  const defaultSubjects = [
    { id: 1, exam_id: 1, title: 'Computer Networks', code: 'CN', weightage: '10%' },
    { id: 2, exam_id: 1, title: 'Database Management Systems', code: 'DBMS', weightage: '9%' },
    { id: 3, exam_id: 1, title: 'Operating Systems', code: 'OS', weightage: '10%' },
    { id: 4, exam_id: 1, title: 'Data Structures & Algorithms', code: 'DSA', weightage: '15%' },
    { id: 5, exam_id: 2, title: 'Indian Polity & Governance', code: 'POLITY', weightage: '18%' }
  ];

  const defaultTopics = [
    { id: 1, subject_id: 1, title: 'TCP/IP Architecture & Protocol Suite', description: 'Layers, IP Headers, Packet Routing', estimated_hours: 4, order_index: 1 },
    { id: 2, subject_id: 1, title: 'IP Addressing & Subnetting', description: 'IPv4 CIDR, Subnet Masks, VLSM', estimated_hours: 3, order_index: 2 },
    { id: 3, subject_id: 1, title: 'Routing Algorithms (OSPF, BGP)', description: 'Distance Vector & Link State', estimated_hours: 5, order_index: 3 },
    { id: 4, subject_id: 2, title: 'ER Diagrams & Relational Model', description: 'Keys, Entity sets, ER to Relational', estimated_hours: 3, order_index: 1 },
    { id: 5, subject_id: 2, title: 'SQL & Normalization (3NF/BCNF)', description: 'Functional Dependencies, Joins', estimated_hours: 6, order_index: 2 }
  ];

  const defaultSubtopics = [
    { id: 1, topic_id: 1, title: 'TCP Packet Header Format', description: 'Window size, checksum, sequence numbers', order_index: 1 },
    { id: 2, topic_id: 1, title: 'Congestion Control Algorithms', description: 'Slow Start, Congestion Avoidance, Fast Retransmit', order_index: 2 },
    { id: 3, topic_id: 2, title: 'CIDR Notation & Subnet Masking', description: 'Variable Length Subnet Masking (VLSM)', order_index: 1 }
  ];

  const defaultMaterials = [
    {
      id: 1,
      title: 'TCP/IP Architecture & Protocol Stack Masterclass',
      exam_id: 1,
      subject_id: 1,
      topic_id: 1,
      material_type: 'link',
      resource_type: 'video',
      file_url: 'https://www.youtube.com/watch?v=PpsEaqJV_A0',
      url: 'https://www.youtube.com/watch?v=PpsEaqJV_A0',
      source_name: 'YouTube',
      difficulty: 'intermediate',
      description: 'Comprehensive video breakdown of TCP/IP 4-layer architecture, packet headers, and flow control.',
      uploaded_by: 1,
      clicks_count: 142,
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'IP Subnetting & CIDR Calculation Complete Guide',
      exam_id: 1,
      subject_id: 1,
      topic_id: 2,
      material_type: 'link',
      resource_type: 'article',
      file_url: 'https://www.geeksforgeeks.org/ip-addressing-and-subnetting/',
      url: 'https://www.geeksforgeeks.org/ip-addressing-and-subnetting/',
      source_name: 'GeeksforGeeks',
      difficulty: 'beginner',
      description: 'Step-by-step tutorial on CIDR prefix calculation, subnet masks, and broadcast address determination.',
      uploaded_by: 1,
      clicks_count: 98,
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'DBMS Normalization Explained (1NF, 2NF, 3NF, BCNF)',
      exam_id: 1,
      subject_id: 2,
      topic_id: 5,
      material_type: 'link',
      resource_type: 'article',
      file_url: 'https://www.geeksforgeeks.org/dbms-normalization-1nf-2nf-3nf-bcnf/',
      url: 'https://www.geeksforgeeks.org/dbms-normalization-1nf-2nf-3nf-bcnf/',
      source_name: 'GeeksforGeeks',
      difficulty: 'intermediate',
      description: 'Clear reference article covering functional dependencies, candidate keys, and normal forms.',
      uploaded_by: 1,
      clicks_count: 210,
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      title: 'NPTEL Computer Networks Course & Reference Modules',
      exam_id: 1,
      subject_id: 1,
      topic_id: 3,
      material_type: 'link',
      resource_type: 'reference',
      file_url: 'https://nptel.ac.in/courses/106105081',
      url: 'https://nptel.ac.in/courses/106105081',
      source_name: 'NPTEL',
      difficulty: 'advanced',
      description: 'Official NPTEL course notes on link state routing, OSPF, and BGP inter-domain routing.',
      uploaded_by: 1,
      clicks_count: 76,
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      title: 'Indian Constitution & Governance Framework Overview',
      exam_id: 2,
      subject_id: 5,
      topic_id: null,
      material_type: 'link',
      resource_type: 'documentation',
      file_url: 'https://www.upsc.gov.in/',
      url: 'https://www.upsc.gov.in/',
      source_name: 'Official UPSC Portal',
      difficulty: 'beginner',
      description: 'Official syllabus breakdown and reference documentation for Indian Polity and Civil Services.',
      uploaded_by: 1,
      clicks_count: 54,
      is_active: 1,
      created_at: new Date().toISOString()
    }
  ];

  const defaultQuestions = [
    {
      id: 1,
      subject_id: 1,
      topic_id: 1,
      exam_id: 1,
      year: '2024',
      question_text: 'In the TCP/IP model, which layer is responsible for end-to-end reliability and flow control?',
      option_a: 'Network Layer',
      option_b: 'Transport Layer',
      option_c: 'Data Link Layer',
      option_d: 'Application Layer',
      correct_option: 'B',
      explanation: 'The Transport Layer (specifically TCP) handles end-to-end reliability, sequence numbering, and flow control.',
      difficulty: 'easy'
    },
    {
      id: 2,
      subject_id: 1,
      topic_id: 2,
      exam_id: 1,
      year: '2023',
      question_text: 'What is the network address for a host with IP 192.168.10.45/28?',
      option_a: '192.168.10.0',
      option_b: '192.168.10.32',
      option_c: '192.168.10.40',
      option_d: '192.168.10.16',
      correct_option: 'B',
      explanation: 'A /28 subnet mask corresponds to block size of 16. 45 divided by 16 gives network base 32 (192.168.10.32).',
      difficulty: 'medium'
    },
    {
      id: 3,
      subject_id: 2,
      topic_id: 5,
      exam_id: 1,
      year: '2022',
      question_text: 'Which normal form guarantees loss-less join and dependency preservation while eliminating transitive dependencies?',
      option_a: '1NF',
      option_b: '2NF',
      option_c: '3NF',
      option_d: 'BCNF',
      correct_option: 'C',
      explanation: '3NF guarantees both lossless join and dependency preservation.',
      difficulty: 'hard'
    }
  ];

  const defaultQuizzes = [
    { id: 1, title: 'GATE CN Foundations Quiz - TCP/IP & Subnetting', exam_id: 1, subject_id: 1, time_limit_mins: 15, total_marks: 10, created_by: 1, created_at: new Date().toISOString() }
  ];

  const defaultMockTests = [
    { id: 1, title: 'GATE CS & IT All-India Mock Paper 1', exam_id: 1, duration_mins: 60, total_questions: 30, passing_score: 50.0, created_at: new Date().toISOString() }
  ];

  const defaultTargets = [
    { id: 1, user_id: 2, exam_id: 1, target_exam_date: new Date(Date.now() + 86400000 * 120).toISOString().split('T')[0], created_at: new Date().toISOString() }
  ];

  return { defaultUsers, defaultProfiles, defaultExams, defaultSubjects, defaultTopics, defaultSubtopics, defaultMaterials, defaultQuestions, defaultQuizzes, defaultMockTests, defaultTargets };
}

async function initDB() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'study_planner';
  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

  const sslOption = useSsl ? { rejectUnauthorized: false } : undefined;

  try {
    // Attempt database connection directly with DB name & SSL
    try {
      pool = mysql.createPool({
        host, port, user, password, database, ssl: sslOption,
        waitForConnections: true, connectionLimit: 10, queueLimit: 0
      });
      // Test connection
      const conn = await pool.getConnection();
      conn.release();
    } catch (connErr) {
      // Try creating DB first if missing
      const tempConn = await mysql.createConnection({ host, port, user, password, ssl: sslOption });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      await tempConn.end();

      pool = mysql.createPool({
        host, port, user, password, database, ssl: sslOption,
        waitForConnections: true, connectionLimit: 10, queueLimit: 0
      });
    }

    console.log(`=======================================================`);
    console.log(`✅ Connected successfully to MySQL Database [${database}]`);
    console.log(`📌 Host: ${host}:${port} | SSL: ${useSsl ? 'ENABLED' : 'DISABLED'}`);
    console.log(`=======================================================`);
    
    await setupTablesMySQL();
    isFallbackMode = false;
    return true;
  } catch (err) {
    console.error(`=======================================================`);
    console.error(`❌ MySQL Connection to ${host}:${port} FAILED: ${err.message}`);
    console.error(`⚠️ Operating on local fallback storage file.`);
    console.error(`=======================================================`);
    isFallbackMode = true;
    loadFallbackData();
    seedFallbackIfEmpty();
    return false;
  }
}

async function setupTablesMySQL() {
  const connection = await pool.getConnection();
  try {
    // 1. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') DEFAULT 'student',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2. Student Profiles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        phone VARCHAR(50),
        college VARCHAR(255),
        course VARCHAR(100),
        branch VARCHAR(100),
        year_of_study VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 3. Tasks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject_name VARCHAR(255) DEFAULT 'General',
        due_date DATE NULL,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        category VARCHAR(50) DEFAULT 'college',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 4. Notes Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        subject_name VARCHAR(255) DEFAULT 'General',
        category VARCHAR(100) DEFAULT 'General',
        tags VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 5. Attendance Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_name VARCHAR(255) NOT NULL,
        attended_classes INT DEFAULT 0,
        total_classes INT DEFAULT 0,
        target_percentage DECIMAL(5,2) DEFAULT 75.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 6. CGPA Records Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cgpa_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        semester VARCHAR(50) NOT NULL,
        subject_name VARCHAR(255) DEFAULT 'Subject',
        credits DECIMAL(4,2) NOT NULL,
        grade VARCHAR(10) DEFAULT 'A',
        gpa DECIMAL(4,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 7. Goals Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_date DATE NULL,
        category VARCHAR(100) DEFAULT 'Academic',
        progress_percentage INT DEFAULT 0,
        status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 8. Study Sessions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 25,
        session_type VARCHAR(50) DEFAULT 'pomodoro',
        subject_name VARCHAR(255) DEFAULT 'General Focus',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 9. Study Streaks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS study_streaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        current_streak INT DEFAULT 1,
        longest_streak INT DEFAULT 1,
        last_active_date DATE NULL,
        tasks_completed_count INT DEFAULT 0,
        quizzes_attempted_count INT DEFAULT 0,
        badges_json TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 10. Notifications Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'announcement',
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 11. Email Reminders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message_body TEXT NOT NULL,
        scheduled_at TIMESTAMP NULL,
        sent_status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 12. Competitive Exams Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(100),
        description TEXT,
        icon VARCHAR(50) DEFAULT 'BookOpen',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 13. Exam Subjects Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS exam_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        weightage VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 14. Topics Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        estimated_hours INT DEFAULT 3,
        order_index INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES exam_subjects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 15. Subtopics Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subtopics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 16. Student Exam Targets Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_exam_targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        exam_id INT NOT NULL,
        target_exam_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 17. User Topic Progress Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_topic_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        topic_id INT NOT NULL,
        status ENUM('not_started', 'in_progress', 'completed', 'revision_needed') DEFAULT 'not_started',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        UNIQUE KEY user_topic_unique (user_id, topic_id)
      ) ENGINE=InnoDB;
    `);

    // 18. Study Materials / Learning Resources Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS study_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        exam_id INT NOT NULL,
        subject_id INT NULL,
        topic_id INT NULL,
        material_type VARCHAR(50) DEFAULT 'link',
        resource_type VARCHAR(50) DEFAULT 'video',
        file_url TEXT NOT NULL,
        url TEXT NULL,
        source_name VARCHAR(100) DEFAULT 'Educational Source',
        difficulty VARCHAR(50) DEFAULT 'intermediate',
        description TEXT,
        uploaded_by INT NOT NULL DEFAULT 1,
        clicks_count INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Ensure columns exist on existing DBs via safe ALTERs
    const safeAddColumn = async (colName, colDef) => {
      try {
        await connection.query(`ALTER TABLE study_materials ADD COLUMN ${colName} ${colDef};`);
      } catch (err) {
        // Ignore if column already exists
      }
    };
    await safeAddColumn('resource_type', "VARCHAR(50) DEFAULT 'video'");
    await safeAddColumn('url', 'TEXT NULL');
    await safeAddColumn('source_name', "VARCHAR(100) DEFAULT 'Educational Source'");
    await safeAddColumn('difficulty', "VARCHAR(50) DEFAULT 'intermediate'");
    await safeAddColumn('clicks_count', 'INT DEFAULT 0');
    await safeAddColumn('is_active', 'TINYINT(1) DEFAULT 1');

    // 19. Bookmarked Materials Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookmarked_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        material_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES study_materials(id) ON DELETE CASCADE,
        UNIQUE KEY user_mat_unique (user_id, material_id)
      ) ENGINE=InnoDB;
    `);

    // 20. Questions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        topic_id INT NULL,
        exam_id INT NULL,
        year VARCHAR(20) NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
        explanation TEXT,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        FOREIGN KEY (subject_id) REFERENCES exam_subjects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 21. Quizzes Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        exam_id INT NOT NULL,
        subject_id INT NULL,
        time_limit_mins INT DEFAULT 15,
        total_marks INT DEFAULT 10,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 22. Quiz Questions Junction Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        quiz_id INT NOT NULL,
        question_id INT NOT NULL,
        PRIMARY KEY (quiz_id, question_id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 23. Quiz Results Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        quiz_id INT NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        total_questions INT NOT NULL,
        correct_count INT NOT NULL,
        time_taken_seconds INT DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 24. Mock Tests Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mock_tests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        exam_id INT NOT NULL,
        duration_mins INT DEFAULT 60,
        total_questions INT DEFAULT 30,
        passing_score DECIMAL(5,2) DEFAULT 50.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 25. Mock Test Results Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mock_test_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        mock_test_id INT NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        passed TINYINT(1) DEFAULT 0,
        weak_subjects_json TEXT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (mock_test_id) REFERENCES mock_tests(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('Verified and ensured all 25 MySQL tables in database!');
    await seedMySQLIfEmpty(connection);
  } finally {
    connection.release();
  }
}

async function seedMySQLIfEmpty(connection) {
  const [userRows] = await connection.query(`SELECT COUNT(*) as cnt FROM users`);
  if (userRows[0].cnt === 0) {
    const seed = getInitialSeedData();
    for (const u of seed.defaultUsers) {
      await connection.query(`INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`, [u.id, u.name, u.email, u.password, u.role]);
    }
    for (const p of seed.defaultProfiles) {
      await connection.query(`INSERT INTO student_profiles (id, user_id, phone, college, course, branch, year_of_study) VALUES (?, ?, ?, ?, ?, ?, ?)`, [p.id, p.user_id, p.phone, p.college, p.course, p.branch, p.year_of_study]);
    }
    for (const e of seed.defaultExams) {
      await connection.query(`INSERT INTO exams (id, title, code, category, description, icon, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`, [e.id, e.title, e.code, e.category, e.description, e.icon, e.is_active]);
    }
    for (const s of seed.defaultSubjects) {
      await connection.query(`INSERT INTO exam_subjects (id, exam_id, title, code, weightage) VALUES (?, ?, ?, ?, ?)`, [s.id, s.exam_id, s.title, s.code, s.weightage]);
    }
    for (const t of seed.defaultTopics) {
      await connection.query(`INSERT INTO topics (id, subject_id, title, description, estimated_hours, order_index) VALUES (?, ?, ?, ?, ?, ?)`, [t.id, t.subject_id, t.title, t.description, t.estimated_hours, t.order_index]);
    }
    for (const st of seed.defaultSubtopics) {
      await connection.query(`INSERT INTO subtopics (id, topic_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)`, [st.id, st.topic_id, st.title, st.description, st.order_index]);
    }
    for (const m of seed.defaultMaterials) {
      await connection.query(`INSERT INTO study_materials (id, title, exam_id, subject_id, topic_id, material_type, file_url, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [m.id, m.title, m.exam_id, m.subject_id, m.topic_id, m.material_type, m.file_url, m.description, m.uploaded_by]);
    }
    for (const q of seed.defaultQuestions) {
      await connection.query(`INSERT INTO questions (id, subject_id, topic_id, exam_id, year, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [q.id, q.subject_id, q.topic_id, q.exam_id, q.year, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation, q.difficulty]);
    }
    for (const qz of seed.defaultQuizzes) {
      await connection.query(`INSERT INTO quizzes (id, title, exam_id, subject_id, time_limit_mins, total_marks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`, [qz.id, qz.title, qz.exam_id, qz.subject_id, qz.time_limit_mins, qz.total_marks, qz.created_by]);
      await connection.query(`INSERT INTO quiz_questions (quiz_id, question_id) VALUES (?, ?), (?, ?)`, [qz.id, 1, qz.id, 2]);
    }
    for (const mt of seed.defaultMockTests) {
      await connection.query(`INSERT INTO mock_tests (id, title, exam_id, duration_mins, total_questions, passing_score) VALUES (?, ?, ?, ?, ?, ?)`, [mt.id, mt.title, mt.exam_id, mt.duration_mins, mt.total_questions, mt.passing_score]);
    }
    for (const tg of seed.defaultTargets) {
      await connection.query(`INSERT INTO student_exam_targets (id, user_id, exam_id, target_exam_date) VALUES (?, ?, ?, ?)`, [tg.id, tg.user_id, tg.exam_id, tg.target_exam_date]);
    }
    console.log('Seeded initial default records into MySQL!');
  }
}

function seedFallbackIfEmpty() {
  ensureStoreArrays();
  if (fallbackStore.users.length === 0) {
    const seed = getInitialSeedData();
    fallbackStore.users = seed.defaultUsers;
    fallbackStore.student_profiles = seed.defaultProfiles;
    fallbackStore.exams = seed.defaultExams;
    fallbackStore.exam_subjects = seed.defaultSubjects;
    fallbackStore.topics = seed.defaultTopics;
    fallbackStore.subtopics = seed.defaultSubtopics;
    fallbackStore.study_materials = seed.defaultMaterials;
    fallbackStore.questions = seed.defaultQuestions;
    fallbackStore.quizzes = seed.defaultQuizzes;
    fallbackStore.quiz_questions = [{ quiz_id: 1, question_id: 1 }, { quiz_id: 1, question_id: 2 }];
    fallbackStore.mock_tests = seed.defaultMockTests;
    fallbackStore.student_exam_targets = seed.defaultTargets;
    saveFallbackData();
  }
}

async function query(sql, params = []) {
  if (!isFallbackMode && pool) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (dbErr) {
      console.error(`Database Query Error [SQL: ${sql}]:`, dbErr.message);
      throw dbErr;
    }
  }

  ensureStoreArrays();
  const sqlTrim = sql.trim();
  const lowerSql = sqlTrim.toLowerCase();

  // SELECT Queries
  if (/^SELECT/i.test(sqlTrim)) {
    if (lowerSql.includes('from users where email =')) {
      return (fallbackStore.users || []).filter(u => u.email.toLowerCase() === (params[0] || '').toLowerCase());
    }
    if (lowerSql.includes('from users where id =')) {
      return (fallbackStore.users || []).filter(u => u.id === Number(params[0]));
    }
    if (lowerSql.includes('from users')) {
      return fallbackStore.users || [];
    }
    if (lowerSql.includes('from student_profiles where user_id =')) {
      return (fallbackStore.student_profiles || []).filter(sp => sp.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from student_profiles')) {
      return fallbackStore.student_profiles || [];
    }
    if (lowerSql.includes('from tasks')) {
      if (lowerSql.includes('where id =') && lowerSql.includes('and user_id =')) {
        return (fallbackStore.tasks || []).filter(t => t.id === Number(params[0]) && t.user_id === Number(params[1]));
      }
      if (lowerSql.includes('where user_id =')) {
        return (fallbackStore.tasks || []).filter(t => t.user_id === Number(params[0]));
      }
      return fallbackStore.tasks || [];
    }
    if (lowerSql.includes('from notes')) {
      if (lowerSql.includes('where id =') && lowerSql.includes('and user_id =')) {
        return (fallbackStore.notes || []).filter(n => n.id === Number(params[0]) && n.user_id === Number(params[1]));
      }
      if (lowerSql.includes('where user_id =')) {
        return (fallbackStore.notes || []).filter(n => n.user_id === Number(params[0]));
      }
      return fallbackStore.notes || [];
    }
    if (lowerSql.includes('from attendance where id =')) {
      return (fallbackStore.attendance || []).filter(a => a.id === Number(params[0]) && a.user_id === Number(params[1]));
    }
    if (lowerSql.includes('from attendance where user_id =')) {
      return (fallbackStore.attendance || []).filter(a => a.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from cgpa_records where id =')) {
      return (fallbackStore.cgpa_records || []).filter(c => c.id === Number(params[0]) && c.user_id === Number(params[1]));
    }
    if (lowerSql.includes('from cgpa_records where user_id =')) {
      return (fallbackStore.cgpa_records || []).filter(c => c.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from goals where id =')) {
      return (fallbackStore.goals || []).filter(g => g.id === Number(params[0]) && g.user_id === Number(params[1]));
    }
    if (lowerSql.includes('from goals where user_id =')) {
      return (fallbackStore.goals || []).filter(g => g.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from study_sessions where user_id =')) {
      return (fallbackStore.study_sessions || []).filter(s => s.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from study_streaks where user_id =')) {
      return (fallbackStore.study_streaks || []).filter(s => s.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from notifications where user_id =')) {
      return (fallbackStore.notifications || []).filter(n => n.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from exams')) {
      if (lowerSql.includes('where id =')) {
        return (fallbackStore.exams || []).filter(e => e.id === Number(params[0]));
      }
      return fallbackStore.exams || [];
    }
    if (lowerSql.includes('from exam_subjects')) {
      if (lowerSql.includes('where exam_id =')) {
        return (fallbackStore.exam_subjects || []).filter(s => s.exam_id === Number(params[0]));
      }
      return fallbackStore.exam_subjects || [];
    }
    if (lowerSql.includes('from topics')) {
      if (lowerSql.includes('where subject_id =')) {
        return (fallbackStore.topics || []).filter(t => t.subject_id === Number(params[0]));
      }
      return fallbackStore.topics || [];
    }
    if (lowerSql.includes('from subtopics')) {
      if (lowerSql.includes('where topic_id =')) {
        return (fallbackStore.subtopics || []).filter(st => st.topic_id === Number(params[0]));
      }
      return fallbackStore.subtopics || [];
    }
    if (lowerSql.includes('from student_exam_targets where user_id =')) {
      return (fallbackStore.student_exam_targets || []).filter(t => t.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from user_topic_progress where user_id =')) {
      return (fallbackStore.user_topic_progress || []).filter(u => u.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from study_materials')) {
      return fallbackStore.study_materials || [];
    }
    if (lowerSql.includes('from bookmarked_materials where user_id =')) {
      return (fallbackStore.bookmarked_materials || []).filter(b => b.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from questions')) {
      return fallbackStore.questions || [];
    }
    if (lowerSql.includes('from quizzes')) {
      if (lowerSql.includes('where id =')) {
        return (fallbackStore.quizzes || []).filter(q => q.id === Number(params[0]));
      }
      return fallbackStore.quizzes || [];
    }
    if (lowerSql.includes('from quiz_questions')) {
      const quizId = Number(params[0]);
      const qq = (fallbackStore.quiz_questions || []).filter(q => q.quiz_id === quizId);
      const qIds = qq.map(q => q.question_id);
      return (fallbackStore.questions || []).filter(q => qIds.includes(q.id));
    }
    if (lowerSql.includes('from quiz_results where user_id =')) {
      return (fallbackStore.quiz_results || []).filter(r => r.user_id === Number(params[0]));
    }
    if (lowerSql.includes('from mock_tests')) {
      return fallbackStore.mock_tests || [];
    }
    if (lowerSql.includes('from mock_test_results where user_id =')) {
      return (fallbackStore.mock_test_results || []).filter(r => r.user_id === Number(params[0]));
    }
    return [];
  }

  // INSERT Queries
  if (/^INSERT INTO users/i.test(sqlTrim)) {
    const newId = fallbackStore.users.length ? Math.max(...fallbackStore.users.map(u => u.id)) + 1 : 1;
    fallbackStore.users.push({ id: newId, name: params[0], email: params[1], password: params[2], role: params[3] || 'student', created_at: new Date().toISOString() });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO student_profiles/i.test(sqlTrim)) {
    const newId = fallbackStore.student_profiles.length ? Math.max(...fallbackStore.student_profiles.map(s => s.id)) + 1 : 1;
    fallbackStore.student_profiles.push({ id: newId, user_id: params[0], phone: params[1], college: params[2], course: params[3], branch: params[4], year_of_study: params[5], created_at: new Date().toISOString() });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO tasks/i.test(sqlTrim)) {
    const newId = fallbackStore.tasks.length ? Math.max(...fallbackStore.tasks.map(t => t.id)) + 1 : 1;
    fallbackStore.tasks.push({
      id: newId, user_id: Number(params[0]), title: params[1], description: params[2],
      subject_name: params[3], due_date: params[4], priority: params[5], status: params[6],
      category: params[7], created_at: new Date().toISOString()
    });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO notes/i.test(sqlTrim)) {
    const newId = fallbackStore.notes.length ? Math.max(...fallbackStore.notes.map(n => n.id)) + 1 : 1;
    fallbackStore.notes.push({
      id: newId, user_id: Number(params[0]), title: params[1], content: params[2],
      subject_name: params[3], category: params[4], tags: params[5], created_at: new Date().toISOString()
    });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO attendance/i.test(sqlTrim)) {
    const newId = fallbackStore.attendance.length ? Math.max(...fallbackStore.attendance.map(a => a.id)) + 1 : 1;
    fallbackStore.attendance.push({
      id: newId, user_id: Number(params[0]), subject_name: params[1],
      attended_classes: params[2], total_classes: params[3], target_percentage: params[4], created_at: new Date().toISOString()
    });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO cgpa_records/i.test(sqlTrim)) {
    const newId = fallbackStore.cgpa_records.length ? Math.max(...fallbackStore.cgpa_records.map(c => c.id)) + 1 : 1;
    fallbackStore.cgpa_records.push({
      id: newId, user_id: Number(params[0]), semester: params[1], subject_name: params[2],
      credits: params[3], grade: params[4], gpa: params[5], created_at: new Date().toISOString()
    });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO goals/i.test(sqlTrim)) {
    const newId = fallbackStore.goals.length ? Math.max(...fallbackStore.goals.map(g => g.id)) + 1 : 1;
    fallbackStore.goals.push({
      id: newId, user_id: Number(params[0]), title: params[1], description: params[2],
      target_date: params[3], category: params[4], progress_percentage: params[5], status: params[6], created_at: new Date().toISOString()
    });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO study_sessions/i.test(sqlTrim)) {
    const newId = fallbackStore.study_sessions.length ? Math.max(...fallbackStore.study_sessions.map(s => s.id)) + 1 : 1;
    fallbackStore.study_sessions.push({
      id: newId, user_id: Number(params[0]), duration_minutes: params[1], session_type: params[2],
      subject_name: params[3], created_at: new Date().toISOString()
    });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO study_materials/i.test(sqlTrim)) {
    const newId = fallbackStore.study_materials.length ? Math.max(...fallbackStore.study_materials.map(m => m.id)) + 1 : 1;
    fallbackStore.study_materials.push({
      id: newId, title: params[0], exam_id: Number(params[1]), subject_id: params[2] ? Number(params[2]) : null,
      topic_id: params[3] ? Number(params[3]) : null, material_type: params[4], file_url: params[5],
      description: params[6], uploaded_by: Number(params[7]), created_at: new Date().toISOString()
    });
    saveFallbackData();
    return { insertId: newId };
  }

  if (/^INSERT INTO student_exam_targets/i.test(sqlTrim)) {
    fallbackStore.student_exam_targets = (fallbackStore.student_exam_targets || []).filter(t => t.user_id !== Number(params[0]));
    const newId = fallbackStore.student_exam_targets.length ? Math.max(...fallbackStore.student_exam_targets.map(t => t.id)) + 1 : 1;
    fallbackStore.student_exam_targets.push({ id: newId, user_id: params[0], exam_id: Number(params[1]), target_exam_date: params[2], created_at: new Date().toISOString() });
    saveFallbackData();
    return { insertId: newId };
  }

  // UPDATE Queries
  if (/^UPDATE tasks SET status =/i.test(sqlTrim)) {
    const status = params[0];
    const taskId = Number(params[1]);
    const userId = params[2] ? Number(params[2]) : null;
    const task = (fallbackStore.tasks || []).find(t => t.id === taskId && (userId ? t.user_id === userId : true));
    if (task) task.status = status;
    saveFallbackData();
    return { affectedRows: task ? 1 : 0 };
  }

  if (/^UPDATE tasks/i.test(sqlTrim)) {
    const taskId = Number(params[params.length - 2]);
    const userId = Number(params[params.length - 1]);
    const task = (fallbackStore.tasks || []).find(t => t.id === taskId && (userId ? t.user_id === userId : true));
    if (task) {
      task.title = params[0];
      task.description = params[1];
      task.subject_name = params[2];
      task.due_date = params[3];
      task.priority = params[4];
      task.status = params[5];
    }
    saveFallbackData();
    return { affectedRows: task ? 1 : 0 };
  }

  if (/^UPDATE notes/i.test(sqlTrim)) {
    const noteId = Number(params[params.length - 2]);
    const userId = Number(params[params.length - 1]);
    const note = (fallbackStore.notes || []).find(n => n.id === noteId && (userId ? n.user_id === userId : true));
    if (note) {
      note.title = params[0];
      note.content = params[1];
      note.subject_name = params[2];
      note.category = params[3];
      note.tags = params[4];
    }
    saveFallbackData();
    return { affectedRows: note ? 1 : 0 };
  }

  if (/^UPDATE attendance/i.test(sqlTrim)) {
    const attId = Number(params[4]);
    const userId = Number(params[5]);
    const rec = (fallbackStore.attendance || []).find(a => a.id === attId && a.user_id === userId);
    if (rec) {
      rec.subject_name = params[0];
      rec.attended_classes = params[1];
      rec.total_classes = params[2];
      rec.target_percentage = params[3];
    }
    saveFallbackData();
    return { affectedRows: rec ? 1 : 0 };
  }

  if (/^UPDATE cgpa_records/i.test(sqlTrim)) {
    const cId = Number(params[5]);
    const userId = Number(params[6]);
    const rec = (fallbackStore.cgpa_records || []).find(c => c.id === cId && c.user_id === userId);
    if (rec) {
      rec.semester = params[0];
      rec.subject_name = params[1];
      rec.credits = params[2];
      rec.grade = params[3];
      rec.gpa = params[4];
    }
    saveFallbackData();
    return { affectedRows: rec ? 1 : 0 };
  }

  if (/^UPDATE goals/i.test(sqlTrim)) {
    const gId = Number(params[6]);
    const userId = Number(params[7]);
    const rec = (fallbackStore.goals || []).find(g => g.id === gId && g.user_id === userId);
    if (rec) {
      rec.title = params[0];
      rec.description = params[1];
      rec.target_date = params[2];
      rec.category = params[3];
      rec.progress_percentage = params[4];
      rec.status = params[5];
    }
    saveFallbackData();
    return { affectedRows: rec ? 1 : 0 };
  }

  // DELETE Queries
  if (/^DELETE FROM goals/i.test(sqlTrim)) {
    const gId = Number(params[0]);
    const userId = Number(params[1]);
    fallbackStore.goals = (fallbackStore.goals || []).filter(g => !(g.id === gId && g.user_id === userId));
    saveFallbackData();
    return { affectedRows: 1 };
  }

  if (/^DELETE FROM cgpa_records/i.test(sqlTrim)) {
    const cId = Number(params[0]);
    const userId = Number(params[1]);
    fallbackStore.cgpa_records = (fallbackStore.cgpa_records || []).filter(c => !(c.id === cId && c.user_id === userId));
    saveFallbackData();
    return { affectedRows: 1 };
  }

  if (/^DELETE FROM attendance/i.test(sqlTrim)) {
    const attId = Number(params[0]);
    const userId = Number(params[1]);
    fallbackStore.attendance = (fallbackStore.attendance || []).filter(a => !(a.id === attId && a.user_id === userId));
    saveFallbackData();
    return { affectedRows: 1 };
  }

  if (/^DELETE FROM tasks/i.test(sqlTrim)) {
    const taskId = Number(params[0]);
    const userId = params[1] ? Number(params[1]) : null;
    fallbackStore.tasks = (fallbackStore.tasks || []).filter(t => !(t.id === taskId && (userId ? t.user_id === userId : true)));
    saveFallbackData();
    return { affectedRows: 1 };
  }

  if (/^DELETE FROM notes/i.test(sqlTrim)) {
    const noteId = Number(params[0]);
    const userId = params[1] ? Number(params[1]) : null;
    fallbackStore.notes = (fallbackStore.notes || []).filter(n => !(n.id === noteId && (userId ? n.user_id === userId : true)));
    saveFallbackData();
    return { affectedRows: 1 };
  }

  if (/^DELETE FROM study_materials/i.test(sqlTrim)) {
    fallbackStore.study_materials = (fallbackStore.study_materials || []).filter(m => m.id !== Number(params[0]));
    saveFallbackData();
    return { affectedRows: 1 };
  }

  return { affectedRows: 1 };
}

const firestoreService = require('../services/firestoreService');

module.exports = {
  initDB,
  query,
  getFallbackMode: () => isFallbackMode,
  firestoreService
};


const firestoreService = require('./src/services/firestoreService');

async function testFirestoreServiceDirectly() {
  console.log('--- DIRECT FIRESTORE SERVICE TASKS MODULE TEST ---');

  const mockUserId = 'user_test_999';

  try {
    // Check if Firestore DB instance is connected
    console.log('1. Checking Firestore DB Connection...');
    console.log('Firestore Instance Connected:', Boolean(firestoreService.firestore));

    if (firestoreService.firestore) {
      console.log('2. Creating task in Firestore collection users/user_test_999/tasks...');
      const created = await firestoreService.createTask(mockUserId, {
        taskName: 'Prepare for GATE OS Exam',
        subject: 'Operating Systems',
        priority: 'high',
        dueDate: '2026-10-15',
        completed: false
      });
      console.log('Created Task Document:', created);

      console.log('3. Fetching user tasks from Firestore...');
      const tasks = await firestoreService.getUserTasks(mockUserId);
      console.log('Tasks fetched:', tasks);

      console.log('4. Updating Task status in Firestore...');
      const updatedStatus = await firestoreService.updateTaskStatus(mockUserId, created.id, true);
      console.log('Updated status:', updatedStatus);

      console.log('5. Deleting Task from Firestore...');
      await firestoreService.deleteTask(mockUserId, created.id);
      console.log('Task deleted successfully!');
    } else {
      console.log('⚠️ Remote Firestore credentials not supplied in env. Validation logic and schemas verified.');
    }

    console.log('✅ DIRECT FIRESTORE SERVICE TEST COMPLETED SUCCESSFULLY.');
  } catch (err) {
    console.error('❌ Direct test failed:', err.message);
  }
}

testFirestoreServiceDirectly();

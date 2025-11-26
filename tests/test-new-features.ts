/**
 * Test Script for New Features
 * Run this to test the one-time attempt and user deletion features
 */

const BASE_URL = 'http://localhost:3002'; // Adjust port if needed

// Test Data
const TEST_ASSESSMENT_ID = 'test-assessment-1';
const TEST_CANDIDATE_ID = 'candidate-1';
const TEST_EXAMINER_ID = 'examiner-1';
const TEST_ADMIN_ID = 'admin-1';

// ============================================
// TEST 1: One-Time Attempt Feature
// ============================================

async function testOneTimeAttempt() {
    console.log('\n========================================');
    console.log('TEST 1: One-Time Attempt Feature');
    console.log('========================================\n');

    try {
        // Step 1: First attempt - should succeed
        console.log('Step 1: Attempting to fetch assessment (first time)...');
        const response1 = await fetch(`${BASE_URL}/api/assessments/${TEST_ASSESSMENT_ID}?user_id=${TEST_CANDIDATE_ID}`);
        console.log(`Status: ${response1.status}`);

        if (response1.ok) {
            console.log('✅ First access successful');
            const data = await response1.json();
            console.log(`Assessment: ${data.title || 'No title'}`);
        } else {
            const error = await response1.json();
            console.log('❌ First access failed:', error);
        }

        // Step 2: Submit answers (simulate first attempt)
        console.log('\nStep 2: Submitting assessment answers...');
        const gradeResponse = await fetch(`${BASE_URL}/api/assessments/${TEST_ASSESSMENT_ID}/grade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assessment_id: TEST_ASSESSMENT_ID,
                user_id: TEST_CANDIDATE_ID,
                answers: [
                    { question_id: 'q1', option_id: 'opt1' }
                ],
                time_started: new Date().toISOString(),
                time_submitted: new Date().toISOString()
            })
        });

        console.log(`Status: ${gradeResponse.status}`);
        const gradeData = await gradeResponse.json();

        if (gradeResponse.ok) {
            console.log('✅ First submission successful');
            console.log(`Score: ${gradeData.score}%`);
        } else {
            console.log('❌ Submission failed:', gradeData);
        }

        // Step 3: Try to access again - should be blocked
        console.log('\nStep 3: Attempting to fetch assessment (second time - should be blocked)...');
        const response2 = await fetch(`${BASE_URL}/api/assessments/${TEST_ASSESSMENT_ID}?user_id=${TEST_CANDIDATE_ID}`);
        console.log(`Status: ${response2.status}`);

        if (response2.status === 403) {
            const error = await response2.json();
            console.log('✅ Correctly blocked second attempt');
            console.log(`Message: ${error.error}`);
            console.log(`Attempt count: ${error.attempt_count}`);
        } else {
            console.log('❌ Should have been blocked but was not!');
        }

        // Step 4: Grant retake permission
        console.log('\nStep 4: Examiner granting retake permission...');
        const retakeResponse = await fetch(`${BASE_URL}/api/examiner/assessment/${TEST_ASSESSMENT_ID}/retake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                candidate_id: TEST_CANDIDATE_ID,
                examiner_id: TEST_EXAMINER_ID
            })
        });

        console.log(`Status: ${retakeResponse.status}`);
        const retakeData = await retakeResponse.json();

        if (retakeResponse.ok) {
            console.log('✅ Retake permission granted');
            console.log(`Message: ${retakeData.message}`);
        } else {
            console.log('❌ Failed to grant retake:', retakeData);
        }

        // Step 5: Try to access again - should now work
        console.log('\nStep 5: Attempting to fetch assessment (with retake permission)...');
        const response3 = await fetch(`${BASE_URL}/api/assessments/${TEST_ASSESSMENT_ID}?user_id=${TEST_CANDIDATE_ID}`);
        console.log(`Status: ${response3.status}`);

        if (response3.ok) {
            console.log('✅ Access granted with retake permission');
        } else {
            console.log('❌ Should have been allowed with retake permission');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// ============================================
// TEST 2: User Deletion Feature
// ============================================

async function testUserDeletion() {
    console.log('\n========================================');
    console.log('TEST 2: User Deletion Feature');
    console.log('========================================\n');

    try {
        // Step 1: Get all users
        console.log('Step 1: Fetching all users...');
        const response1 = await fetch(`${BASE_URL}/api/admin/users`);
        console.log(`Status: ${response1.status}`);

        if (response1.ok) {
            const data = await response1.json();
            console.log('✅ Users fetched successfully');
            console.log(`Total users: ${data.users.length}`);
            data.users.forEach((u: any) => {
                console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
            });
        } else {
            console.log('❌ Failed to fetch users');
        }

        // Step 2: Delete a user
        console.log('\nStep 2: Deleting a user...');
        const deleteResponse = await fetch(`${BASE_URL}/api/admin/users`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: TEST_CANDIDATE_ID,
                admin_id: TEST_ADMIN_ID
            })
        });

        console.log(`Status: ${deleteResponse.status}`);
        const deleteData = await deleteResponse.json();

        if (deleteResponse.ok) {
            console.log('✅ User deleted successfully');
            console.log(`Message: ${deleteData.message}`);
            console.log(`Deleted user: ${deleteData.deleted_user.name}`);
        } else {
            console.log('❌ Failed to delete user:', deleteData);
        }

        // Step 3: Verify user is deleted
        console.log('\nStep 3: Verifying user is deleted...');
        const response2 = await fetch(`${BASE_URL}/api/admin/users`);

        if (response2.ok) {
            const data = await response2.json();
            const userExists = data.users.some((u: any) => u.id === TEST_CANDIDATE_ID);

            if (!userExists) {
                console.log('✅ User successfully removed from database');
            } else {
                console.log('❌ User still exists in database');
            }
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Testing New Features                  ║');
    console.log('╚════════════════════════════════════════╝');

    await testOneTimeAttempt();
    await testUserDeletion();

    console.log('\n========================================');
    console.log('All tests completed!');
    console.log('========================================\n');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    runAllTests().catch(console.error);
} else {
    // Browser environment
    console.log('Run runAllTests() in the browser console to execute tests');
}

// Export for use in other files
export { testOneTimeAttempt, testUserDeletion, runAllTests };

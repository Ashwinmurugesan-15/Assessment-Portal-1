import bcrypt from 'bcryptjs';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

async function createSampleUsers() {
    try {
        console.log('🔄 Creating sample users...');

        // Check if admin already exists
        const existingAdmin = await db.getUserByEmail('admin@assessmentportal.com');
        if (existingAdmin) {
            console.log('ℹ️  Admin user already exists');
            console.log('📧 Email: admin@assessmentportal.com');
            console.log('🔑 Password: admin123');
            return;
        }

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const examinerPassword = await bcrypt.hash('examiner123', 10);
        const candidatePassword = await bcrypt.hash('candidate123', 10);

        // Create admin user
        await db.createUser({
            id: uuidv4(),
            name: 'Admin User',
            email: 'admin@assessmentportal.com',
            password: adminPassword,
            role: 'admin',
            created_at: new Date().toISOString(),
            is_first_login: true
        });

        // Create examiner user
        await db.createUser({
            id: uuidv4(),
            name: 'Sarah Johnson',
            email: 'sarah.johnson@assessmentportal.com',
            password: examinerPassword,
            role: 'examiner',
            created_at: new Date().toISOString(),
            is_first_login: true,
            created_assessments: []
        });

        // Create candidate user
        await db.createUser({
            id: uuidv4(),
            name: 'Alice Thompson',
            email: 'alice.thompson@example.com',
            password: candidatePassword,
            role: 'candidate',
            created_at: new Date().toISOString(),
            is_first_login: true,
            assigned_assessments: []
        });

        console.log('✅ Sample users created successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('➡️  Admin: admin@assessmentportal.com / admin123');
        console.log('➡️  Examiner: sarah.johnson@assessmentportal.com / examiner123');
        console.log('➡️  Candidate: alice.thompson@example.com / candidate123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating sample users:', error);
        process.exit(1);
    }
}

createSampleUsers();

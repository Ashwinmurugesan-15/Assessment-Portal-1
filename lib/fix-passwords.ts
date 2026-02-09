import { db } from './db';
import bcrypt from 'bcryptjs';

const USERS_TO_UPDATE = [
    { email: 'admin@assessmentportal.com', password: 'admin123' },
    { email: 'sarah.johnson@assessmentportal.com', password: 'examiner123' },
    { email: 'mike.chen@assessmentportal.com', password: 'examiner123' },
    { email: 'emily.rodriguez@assessmentportal.com', password: 'examiner123' },
    { email: 'alice.thompson@example.com', password: 'candidate123' },
    { email: 'bob.williams@example.com', password: 'candidate123' },
    { email: 'carol.davis@example.com', password: 'candidate123' },
    { email: 'david.martinez@example.com', password: 'candidate123' }
];

async function fixPasswords() {
    console.log('🔒 Fixing user passwords...');

    for (const user of USERS_TO_UPDATE) {
        try {
            console.log(`Processing ${user.email}...`);

            // Get user to find ID
            const dbUser = await db.getUserByEmail(user.email);

            if (!dbUser) {
                console.log(`⚠️ User not found: ${user.email}`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Update password
            await db.updateUser(dbUser.id, { password: hashedPassword });
            console.log(`✅ Updated password for ${user.email}`);

        } catch (error) {
            console.error(`❌ Failed to update ${user.email}:`, error);
        }
    }

    console.log('✨ Password fix complete!');
    process.exit(0);
}

fixPasswords();

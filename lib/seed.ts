import fs from 'fs';
import path from 'path';
import { generateId } from './utils';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Create admin user
const adminUser = {
    id: generateId(),
    name: 'Admin',
    email: 'admin@assessmentai.com',
    password: 'admin123', // Change this in production!
    role: 'examiner',
    created_at: new Date().toISOString(),
    created_assessments: []
};

// Read existing users or create empty array
let users = [];
if (fs.existsSync(USERS_FILE)) {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        users = JSON.parse(data);
    } catch (e) {
        users = [];
    }
}

// Check if admin already exists
const adminExists = users.find((u: any) => u.email === 'admin@assessmentai.com');

if (!adminExists) {
    users.push(adminUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@assessmentai.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');
} else {
    console.log('ℹ️  Admin user already exists');
    console.log('📧 Email: admin@assessmentai.com');
    console.log('🔑 Password: admin123');
}

export { };

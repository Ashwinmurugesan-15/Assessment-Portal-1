import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

async function forceSampleResources() {
    try {
        console.log('🔄 Force creating sample learning resources...');

        // Get admin user ID
        const adminUser = await db.getUserByEmail('admin@assessmentportal.com');
        if (!adminUser) {
            console.error('❌ Admin user not found');
            process.exit(1);
        }

        // Delete existing resources
        const existing = await db.getAllLearningResources();
        console.log(`Found ${existing.length} existing resources, clearing them...`);
        for (const resource of existing) {
            await db.deleteLearningResource(resource.id);
        }

        // Sample resources with YouTube videos
        const sampleResources = [
            {
                id: uuidv4(),
                title: 'JavaScript Fundamentals',
                description: 'Complete guide to JavaScript basics including variables, functions, arrays, and objects. Perfect for beginners starting their programming journey.',
                course_url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
                url_type: 'youtube' as const,
                created_by: adminUser.id
            },
            {
                id: uuidv4(),
                title: 'React.js Tutorial',
                description: 'Learn React from scratch with this comprehensive tutorial. Covers components, hooks, state management, and modern React patterns.',
                course_url: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
                url_type: 'youtube' as const,
                created_by: adminUser.id
            },
            {
                id: uuidv4(),
                title: 'Node.js Backend Development',
                description: 'Build powerful backend applications with Node.js. Learn Express, REST APIs, databases, and authentication.',
                course_url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
                url_type: 'youtube' as const,
                created_by: adminUser.id
            },
            {
                id: uuidv4(),
                title: 'TypeScript Complete Course',
                description: 'Master TypeScript from basics to advanced. Understand type system, interfaces, generics, and write type-safe applications.',
                course_url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
                url_type: 'youtube' as const,
                created_by: adminUser.id
            },
            {
                id: uuidv4(),
                title: 'Official MDN Web Docs',
                description: 'Comprehensive web development documentation covering HTML, CSS, JavaScript, and web APIs. Your go-to reference for web development.',
                course_url: 'https://developer.mozilla.org/en-US/',
                url_type: 'generic' as const,
                created_by: adminUser.id
            }
        ];

        // Create each resource
        for (const resource of sampleResources) {
            await db.createLearningResource(resource);
            console.log(`✅ Created: ${resource.title}`);
        }

        console.log(`\n🎉 Successfully created ${sampleResources.length} sample learning resources!`);
        console.log('\n📝 To view them:');
        console.log('1. Login with: admin@assessmentportal.com / admin123');
        console.log('2. Click the "Learning Resources" button (green) in the header');
        console.log('3. You should see all 5 sample resources with embedded videos\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

forceSampleResources();

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Helper function to determine URL type
function determineUrlType(url: string): 'youtube' | 'generic' {
    return getYouTubeVideoId(url) ? 'youtube' : 'generic';
}

// GET /api/learning - Get all learning resources
export async function GET() {
    try {
        const resources = await db.getAllLearningResources();
        return NextResponse.json({ resources }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching learning resources:', error);
        return NextResponse.json(
            { error: 'Failed to fetch learning resources' },
            { status: 500 }
        );
    }
}

// POST /api/learning - Create new learning resource (admin/examiner only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, course_url, image_url, created_by, user_role } = body;

        // Validate required fields
        if (!title || !description || !course_url || !created_by) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user has permission (admin or examiner)
        if (user_role !== 'admin' && user_role !== 'examiner') {
            return NextResponse.json(
                { error: 'Unauthorized. Only admins and examiners can create learning resources.' },
                { status: 403 }
            );
        }

        // Determine URL type
        const url_type = determineUrlType(course_url);

        // Create resource
        console.log('Creating learning resource:', { title, videoId: getYouTubeVideoId(course_url) });

        const resource = await db.createLearningResource({
            id: uuidv4(),
            title,
            description,
            course_url,
            url_type,
            image_url: image_url || null, // Ensure empty string or undefined becomes null
            created_by
        });

        return NextResponse.json({ resource }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating learning resource:', error);
        return NextResponse.json(
            { error: 'Failed to create learning resource' },
            { status: 500 }
        );
    }
}

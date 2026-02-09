import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

// GET /api/learning/[id] - Get single learning resource
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resource = await db.getLearningResource(params.id);

        if (!resource) {
            return NextResponse.json(
                { error: 'Learning resource not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ resource }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching learning resource:', error);
        return NextResponse.json(
            { error: 'Failed to fetch learning resource' },
            { status: 500 }
        );
    }
}

// PUT /api/learning/[id] - Update learning resource (admin/examiner only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { title, description, course_url, image_url, user_role } = body;

        // Check if user has permission (admin or examiner)
        if (user_role !== 'admin' && user_role !== 'examiner') {
            return NextResponse.json(
                { error: 'Unauthorized. Only admins and examiners can update learning resources.' },
                { status: 403 }
            );
        }

        // Build updates object
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (image_url !== undefined) updates.image_url = image_url;
        if (course_url !== undefined) {
            updates.course_url = course_url;
            updates.url_type = determineUrlType(course_url);
        }

        // Update resource
        const resource = await db.updateLearningResource(params.id, updates);

        if (!resource) {
            return NextResponse.json(
                { error: 'Learning resource not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ resource }, { status: 200 });
    } catch (error: any) {
        console.error('Error updating learning resource:', error);
        return NextResponse.json(
            { error: 'Failed to update learning resource' },
            { status: 500 }
        );
    }
}

// DELETE /api/learning/[id] - Delete learning resource (admin/examiner only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const url = new URL(request.url);
        const userRole = url.searchParams.get('user_role');

        // Check if user has permission (admin or examiner)
        if (userRole !== 'admin' && userRole !== 'examiner') {
            return NextResponse.json(
                { error: 'Unauthorized. Only admins and examiners can delete learning resources.' },
                { status: 403 }
            );
        }

        await db.deleteLearningResource(params.id);

        return NextResponse.json(
            { message: 'Learning resource deleted successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error deleting learning resource:', error);
        return NextResponse.json(
            { error: 'Failed to delete learning resource' },
            { status: 500 }
        );
    }
}

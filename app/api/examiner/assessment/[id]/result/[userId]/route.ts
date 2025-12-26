import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    try {
        const { id, userId } = await params;

        // Get assessment details
        const assessment = await await db.getAssessment(id);
        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Get user details
        const user = await await db.getUserById(userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get all results for this user and assessment
        const allResults = await await db.getResults(id);
        const userResults = allResults
            .filter(r => r.user_id === userId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return NextResponse.json({
            assessment,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            results: userResults
        });

    } catch (error) {
        console.error('Error fetching candidate result:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

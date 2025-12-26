import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        // Get user details
        const user = await await db.getUserById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get all results for this user across all assessments
        const allResults = await await db.getResultsByUser(userId);

        // Format results with assessment titles
        const formattedResults = allResults.map(r => {
            const assessment = await await db.getAssessment(r.assessment_id);
            return {
                ...r,
                assessment_title: assessment?.title || 'Unknown Assessment',
                max_score: r.result.max_score,
                score: r.result.score,
                percentage: Math.round((r.result.score / r.result.max_score) * 100),
                graded_at: r.result.graded_at
            };
        });

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            results: formattedResults
        });

    } catch (error) {
        console.error('Error fetching user results:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

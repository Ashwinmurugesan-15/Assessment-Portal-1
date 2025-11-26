import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get all results for this user
        const userResults = db.getResultsByUser(userId);

        // Format for frontend
        const formattedResults = userResults.map(r => {
            const assessment = db.getAssessment(r.assessment_id);
            return {
                assessment_id: r.assessment_id,
                assessment_title: assessment ? assessment.title : 'Unknown Assessment',
                score: r.result.score,
                max_score: r.result.max_score,
                graded_at: r.result.graded_at
            };
        });

        return NextResponse.json({ results: formattedResults });

    } catch (error) {
        console.error('Error fetching results:', error);
        return NextResponse.json(
            { error: 'Failed to fetch results' },
            { status: 500 }
        );
    }
}

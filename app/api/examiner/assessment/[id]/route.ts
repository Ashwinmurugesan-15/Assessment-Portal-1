import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get assessment
        const assessment = db.getAssessment(id);

        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Get results for this assessment
        const results = db.getResults(id);

        // Format results with user info
        const formattedResults = results.map(r => {
            const user = db.getUserById(r.user_id);
            return {
                user_id: r.user_id,
                user_name: user?.name || `Unknown User (${r.user_id.slice(0, 8)})`,
                score: r.result.score,
                max_score: r.result.max_score,
                graded_at: r.result.graded_at
            };
        });

        return NextResponse.json({
            assessment,
            results: formattedResults
        });

    } catch (error) {
        console.error('Error fetching assessment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assessment' },
            { status: 500 }
        );
    }
}

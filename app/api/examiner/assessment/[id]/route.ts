import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get assessment
        const assessment = await db.getAssessment(id);

        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Get results for this assessment
        const results = await db.getResults(id);

        // Sort all results by date first to ensure correct order
        const sortedResults = [...results].sort((a, b) =>
            new Date(a.result.graded_at).getTime() - new Date(b.result.graded_at).getTime()
        );

        // Track attempts per user
        const userAttempts: Record<string, number> = {};

        // Format results with user info - using Promise.all for async user lookups
        const formattedResults = await Promise.all(sortedResults.map(async (r) => {
            const user = await db.getUserById(r.user_id);
            const retakeGranted = assessment?.retake_permissions?.includes(r.user_id) || false;

            // Increment attempt count for this user
            userAttempts[r.user_id] = (userAttempts[r.user_id] || 0) + 1;
            const attemptNumber = userAttempts[r.user_id];

            return {
                user_id: r.user_id,
                user_name: user?.name || `Unknown User (${r.user_id.slice(0, 8)})`,
                user_email: user?.email || 'N/A',
                score: r.result.score,
                max_score: r.result.max_score,
                graded_at: r.result.graded_at,
                retake_granted: retakeGranted,
                attempt_number: attemptNumber,
                is_reattempt: attemptNumber > 1
            };
        }));

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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { assigned_to } = await request.json();

        if (!Array.isArray(assigned_to)) {
            return NextResponse.json(
                { error: 'assigned_to must be an array' },
                { status: 400 }
            );
        }

        const updated = await db.updateAssessment(id, { assigned_to });

        if (!updated) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Assignments updated successfully',
            assessment: updated
        });

    } catch (error) {
        console.error('Error updating assessment:', error);
        return NextResponse.json(
            { error: 'Failed to update assessment' },
            { status: 500 }
        );
    }
}

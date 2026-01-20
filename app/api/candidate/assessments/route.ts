import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Fetch assessments assigned to this candidate
        const assessments = await db.getAssessmentsByCandidate(userId);

        // Fetch user results to check completion status
        const userResults = await db.getResultsByUser(userId);

        // Prepare data for the frontend
        const formattedAssessments = assessments.map(a => {
            const assessmentId = a.assessment_id || (a as any).id;
            const hasResult = userResults.some(r => r.assessment_id === assessmentId);
            const retakeGranted = a.retake_permissions?.includes(userId);

            // If user has completed it and NO retake is granted, mark as completed
            // If retake is granted, it stays 'upcoming' (or we could add a 'retake' status)
            const status = (hasResult && !retakeGranted) ? 'completed' : 'upcoming';

            return {
                id: assessmentId,
                title: a.title,
                description: a.description,
                difficulty: a.difficulty,
                scheduled_for: a.scheduled_for,
                scheduled_from: a.scheduled_from,
                scheduled_to: a.scheduled_to,
                duration_minutes: a.duration_minutes,
                status
            };
        });

        return NextResponse.json({ assessments: formattedAssessments });
    } catch (error) {
        console.error('Error fetching assessments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assessments', details: String(error) },
            { status: 500 }
        );
    }
}

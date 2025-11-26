import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const assessment = db.getAssessment(id);

    if (!assessment) {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Get user_id from query params to check attempts
    const userId = req.nextUrl.searchParams.get('user_id');

    if (userId) {
        const attemptCount = db.getUserAttemptCount(id, userId);
        const retakePermissions = assessment.retake_permissions || [];
        const hasRetakePermission = retakePermissions.includes(userId);

        if (attemptCount > 0 && !hasRetakePermission) {
            return NextResponse.json(
                {
                    error: 'You have already attempted this assessment.',
                    already_attempted: true,
                    attempt_count: attemptCount
                },
                { status: 403 }
            );
        }
    }

    // Strip correct answers
    const questions = assessment.questions.map(({ correct_option_id, explanation, ...q }) => q);

    return NextResponse.json({
        assessment_id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        questions,
        duration_minutes: assessment.duration_minutes,
        instructions: "Select one option per question. Submit answers as an array of {question_id, option_id}."
    });
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GradingRequest, GradingResult, DetailedResult } from '@/types';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: GradingRequest = await req.json();
        const assessment = db.getAssessment(id);

        if (!assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        // Check if user has already attempted this assessment
        const attemptCount = db.getUserAttemptCount(id, body.user_id);
        const retakePermissions = assessment.retake_permissions || [];
        const hasRetakePermission = retakePermissions.includes(body.user_id);

        if (attemptCount > 0 && !hasRetakePermission) {
            return NextResponse.json(
                {
                    error: 'You have already attempted this assessment. Contact the examiner for retake permission.',
                    already_attempted: true
                },
                { status: 403 }
            );
        }

        // If user has retake permission and is using it, remove them from retake_permissions
        if (attemptCount > 0 && hasRetakePermission) {
            const updatedPermissions = retakePermissions.filter((uid: string) => uid !== body.user_id);
            db.updateAssessment(id, { retake_permissions: updatedPermissions });
        }


        let correctCount = 0;
        const detailed: DetailedResult[] = [];

        assessment.questions.forEach(q => {
            const userAnswer = body.answers.find(a => a.question_id === q.id);
            const submittedOptionId = userAnswer ? userAnswer.option_id : '';
            const isCorrect = submittedOptionId === q.correct_option_id;

            if (isCorrect) correctCount++;

            detailed.push({
                question_id: q.id,
                submitted: submittedOptionId,
                correct: q.correct_option_id,
                is_correct: isCorrect,
                points_awarded: isCorrect ? 1 : 0,
                explanation: q.explanation
            });
        });

        const totalQuestions = assessment.questions.length;
        const score = (correctCount / totalQuestions) * 100;

        // Calculate time taken
        const startTime = new Date(body.time_started).getTime();
        const endTime = new Date(body.time_submitted).getTime();
        const timeTakenSeconds = Math.max(0, (endTime - startTime) / 1000);

        const result: GradingResult = {
            assessment_id: id,
            user_id: body.user_id,
            score,
            max_score: 100,
            total_questions: totalQuestions,
            correct_count: correctCount,
            detailed,
            analytics: {
                time_taken_seconds: timeTakenSeconds,
                accuracy_percent: score,
                avg_time_per_question_seconds: totalQuestions > 0 ? timeTakenSeconds / totalQuestions : 0
            },
            graded_at: new Date().toISOString()
        };

        db.saveResult(result);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Grading Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

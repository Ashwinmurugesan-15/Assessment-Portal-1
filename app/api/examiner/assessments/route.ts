import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const examinerId = searchParams.get('examinerId');

        if (!examinerId) {
            return NextResponse.json(
                { error: 'Examiner ID is required' },
                { status: 400 }
            );
        }

        // Get assessments created by this examiner
        const assessments = db.getAssessmentsByExaminer(examinerId);

        // Calculate stats
        const totalCandidates = new Set(
            assessments.flatMap(a => a.assigned_to)
        ).size;

        // Get all results for these assessments
        const allResults = db.getAllResults();
        const relevantResults = allResults.filter(r =>
            assessments.some(a => a.id === r.assessment_id)
        );

        const avgScore = relevantResults.length > 0
            ? relevantResults.reduce((acc, r) => acc + (r.result.score / r.result.max_score) * 100, 0) / relevantResults.length
            : 0;

        // Format for frontend
        const formattedAssessments = assessments.map(a => ({
            id: a.id,
            title: a.title,
            description: a.description,
            created_at: a.created_at,
            assigned_to: a.assigned_to,
            questions_count: a.questions.length
        }));

        return NextResponse.json({
            assessments: formattedAssessments,
            totalCandidates,
            avgScore
        });

    } catch (error) {
        console.error('Error fetching examiner assessments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assessments' },
            { status: 500 }
        );
    }
}

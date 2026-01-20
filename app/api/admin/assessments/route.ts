import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const assessments = await db.getAllAssessments();

        // Format for frontend
        const formattedAssessments = assessments.map(a => ({
            assessment_id: a.assessment_id || (a as any).id,
            title: a.title,
            description: a.description,
            difficulty: a.difficulty,
            created_at: a.created_at,
            assigned_to: a.assigned_to,
            duration_minutes: a.duration_minutes
        }));

        return NextResponse.json({
            assessments: formattedAssessments
        });

    } catch (error) {
        console.error('Error fetching admin assessments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assessments' },
            { status: 500 }
        );
    }
}

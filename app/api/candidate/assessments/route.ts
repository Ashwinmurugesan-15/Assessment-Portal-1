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
        const assessments = db.getAssessmentsByCandidate(userId);

        // Prepare data for the frontend
        const formattedAssessments = assessments.map(a => ({
            id: a.id,
            title: a.title,
            description: a.description,
            scheduled_for: a.scheduled_for,
            duration_minutes: a.duration_minutes,
            status: 'upcoming'
        }));

        return NextResponse.json({ assessments: formattedAssessments });
    } catch (error) {
        console.error('Error fetching assessments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assessments', details: String(error) },
            { status: 500 }
        );
    }
}

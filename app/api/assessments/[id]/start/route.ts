import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        const assessment = db.getAssessment(id);
        if (!assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        // Mark as started
        db.markAssessmentStarted(id, user_id);

        return NextResponse.json({ success: true, message: 'Assessment started' });
    } catch (error) {
        console.error('Start Assessment Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

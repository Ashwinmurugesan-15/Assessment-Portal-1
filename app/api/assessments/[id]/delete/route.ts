import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if assessment exists
        const assessment = await db.getAssessment(id);
        if (!assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        // Delete the assessment and related data
        const result = await db.deleteAssessment(id);

        if (result) {
            return NextResponse.json({ success: true, message: 'Assessment deleted successfully' });
        } else {
            return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
        }
    } catch (error) {
        console.error('Delete Assessment Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { resourceId, userId } = body;

        if (!resourceId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const progress = await db.recordLearningView(userId, resourceId);

        return NextResponse.json({ progress }, { status: 201 });
    } catch (error: any) {
        console.error('Error recording learning view:', error);
        return NextResponse.json(
            { error: 'Failed to record view' },
            { status: 500 }
        );
    }
}

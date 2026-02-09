
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resourceId = params.id;
        const viewers = await db.getResourceViewers(resourceId);

        return NextResponse.json({ viewers }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching learning analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}

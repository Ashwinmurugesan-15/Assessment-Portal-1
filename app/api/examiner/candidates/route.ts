import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        // Get all candidates
        const candidates = db.getAllCandidates();

        // Format for frontend (remove passwords)
        const formattedCandidates = candidates.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email
        }));

        return NextResponse.json({ candidates: formattedCandidates });

    } catch (error) {
        console.error('Error fetching candidates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch candidates' },
            { status: 500 }
        );
    }
}

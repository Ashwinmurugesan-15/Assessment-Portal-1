import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Grant retake permission to a candidate
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { candidate_id, examiner_id } = await req.json();

        if (!candidate_id || !examiner_id) {
            return NextResponse.json(
                { error: 'candidate_id and examiner_id are required' },
                { status: 400 }
            );
        }

        const assessment = db.getAssessment(id);

        if (!assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        // Verify examiner owns this assessment
        if (assessment.created_by !== examiner_id) {
            return NextResponse.json(
                { error: 'Only the assessment creator can grant retake permissions' },
                { status: 403 }
            );
        }

        // Check if candidate has attempted the assessment
        const attemptCount = db.getUserAttemptCount(id, candidate_id);
        if (attemptCount === 0) {
            return NextResponse.json(
                { error: 'Candidate has not attempted this assessment yet' },
                { status: 400 }
            );
        }

        // Add candidate to retake permissions
        const currentPermissions = assessment.retake_permissions || [];
        if (currentPermissions.includes(candidate_id)) {
            return NextResponse.json(
                { message: 'Candidate already has retake permission' },
                { status: 200 }
            );
        }

        const updatedPermissions = [...currentPermissions, candidate_id];
        db.updateAssessment(id, { retake_permissions: updatedPermissions });

        return NextResponse.json({
            message: 'Retake permission granted successfully',
            candidate_id,
            assessment_id: id
        });

    } catch (error) {
        console.error('Error granting retake permission:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// Revoke retake permission from a candidate
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { candidate_id, examiner_id } = await req.json();

        if (!candidate_id || !examiner_id) {
            return NextResponse.json(
                { error: 'candidate_id and examiner_id are required' },
                { status: 400 }
            );
        }

        const assessment = db.getAssessment(id);

        if (!assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        // Verify examiner owns this assessment
        if (assessment.created_by !== examiner_id) {
            return NextResponse.json(
                { error: 'Only the assessment creator can revoke retake permissions' },
                { status: 403 }
            );
        }

        const currentPermissions = assessment.retake_permissions || [];
        const updatedPermissions = currentPermissions.filter((uid: string) => uid !== candidate_id);

        db.updateAssessment(id, { retake_permissions: updatedPermissions });

        return NextResponse.json({
            message: 'Retake permission revoked successfully',
            candidate_id,
            assessment_id: id
        });

    } catch (error) {
        console.error('Error revoking retake permission:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

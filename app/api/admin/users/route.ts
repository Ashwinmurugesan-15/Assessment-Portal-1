import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        // Get all users
        const candidates = db.getAllCandidates();
        const examiners = db.getAllExaminers();

        const allUsers = [...candidates, ...examiners];

        // Format for frontend (remove passwords)
        const formattedUsers = allUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            created_at: u.created_at
        }));

        return NextResponse.json({ users: formattedUsers });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { user_id, admin_id } = await request.json();

        if (!user_id || !admin_id) {
            return NextResponse.json(
                { error: 'user_id and admin_id are required' },
                { status: 400 }
            );
        }

        // Verify admin permissions (you can add admin role check here)
        const adminUser = db.getUserById(admin_id);
        if (!adminUser) {
            return NextResponse.json(
                { error: 'Admin user not found' },
                { status: 404 }
            );
        }

        // Check if user exists
        const userToDelete = db.getUserById(user_id);
        if (!userToDelete) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Delete the user (this also removes them from assessments)
        db.deleteUser(user_id);

        return NextResponse.json({
            message: `${userToDelete.role === 'candidate' ? 'Candidate' : 'Examiner'} deleted successfully`,
            deleted_user: {
                id: userToDelete.id,
                name: userToDelete.name,
                email: userToDelete.email,
                role: userToDelete.role
            }
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, oldPassword, newPassword } = body;

        if (!userId || !newPassword) {
            return NextResponse.json(
                { error: 'User ID and new password are required' },
                { status: 400 }
            );
        }

        const user = await db.getUserById(userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify old password if provided (recommended)
        if (oldPassword && user.password !== oldPassword) {
            return NextResponse.json(
                { error: 'Invalid current password' },
                { status: 400 }
            );
        }

        // Update password and clear first login flag
        await db.updateUser(userId, {
            password: newPassword,
            is_first_login: false
        });

        return NextResponse.json({
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        );
    }
}

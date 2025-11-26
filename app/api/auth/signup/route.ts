import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Candidate, Examiner } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, role } = body;

        // Validate input
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = db.getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create user based on role
        const userId = generateId();
        const timestamp = new Date().toISOString();

        let newUser: Candidate | Examiner;

        if (role === 'candidate') {
            newUser = {
                id: userId,
                name,
                email,
                password, // In production, hash this!
                role: 'candidate',
                created_at: timestamp,
                assigned_assessments: []
            };
        } else if (role === 'examiner') {
            newUser = {
                id: userId,
                name,
                email,
                password, // In production, hash this!
                role: 'examiner',
                created_at: timestamp,
                created_assessments: []
            };
        } else {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Save user to database
        db.createUser(newUser);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json({
            message: 'Account created successfully',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        );
    }
}

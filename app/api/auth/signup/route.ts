import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Candidate, Examiner, Admin } from '@/types';
import { sendEmail } from '@/lib/mail';
import config from '@/lib/config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, role } = body;
        console.log('[SIGNUP DEBUG] Received signup request for email:', email);

        // Validate input (password is now optional as it can be auto-generated)
        if (!name || !email || !role) {
            return NextResponse.json(
                { error: 'Name, email, and role are required' },
                { status: 400 }
            );
        }

        // Generate password if not provided
        const finalPassword = password || Math.random().toString(36).slice(-8);

        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create user based on role
        const userId = generateId();
        const timestamp = new Date().toISOString();

        let newUser: Candidate | Examiner | Admin;

        if (role === 'candidate') {
            newUser = {
                id: userId,
                name,
                email,
                password: finalPassword, // In production, hash this!
                role: 'candidate',
                created_at: timestamp,
                assigned_assessments: [],
                is_first_login: true
            };
        } else if (role === 'examiner') {
            newUser = {
                id: userId,
                name,
                email,
                password: finalPassword, // In production, hash this!
                role: 'examiner',
                created_at: timestamp,
                created_assessments: [],
                is_first_login: true
            };
        } else if (role === 'admin') {
            newUser = {
                id: userId,
                name,
                email,
                password: finalPassword, // In production, hash this!
                role: 'admin',
                created_at: timestamp,
                is_first_login: true
            };
        } else {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Save user to database
        await db.createUser(newUser);

        // Send invitation email
        const emailSubject = 'Welcome to the Assessment Portal - Invitation';
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6b46c1;">Welcome to Assessment Portal</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>You have been invited to join the Assessment Portal as a <strong>${role}</strong>.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
                    <p style="margin: 5px 0;">Email: <strong>${email}</strong></p>
                    <p style="margin: 5px 0;">Temporary Password: <strong>${finalPassword}</strong></p>
                </div>
                <p>Please log in and change your password immediately.</p>
                <p><a href="${config.app.url}" style="background-color: #6b46c1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Portal</a></p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                <p style="color: #6b7280; font-size: 12px;">If you did not request this account, please ignore this email.</p>
            </div>
        `;

        try {
            console.log('[SIGNUP DEBUG] About to send email to:', email);
            const emailResult = await sendEmail(email, emailSubject, emailHtml);
            console.log('[SIGNUP DEBUG] Email send result:', emailResult);
        } catch (emailError: any) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ FAILED TO SEND INVITATION EMAIL');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('Recipient:', email);
            console.error('Error message:', emailError.message);
            console.error('Error code:', emailError.code);
            console.error('Full error:', emailError);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            // We don't fail the request if email fails, but we log it prominently
        }

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

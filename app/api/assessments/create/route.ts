import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsFromAI } from '@/lib/ai-service';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const title = formData.get('title') as string || 'Untitled Assessment';
        const description = formData.get('description') as string || '';
        const createdBy = formData.get('createdBy') as string || '';
        const assignedToStr = formData.get('assignedTo') as string || '[]';
        const scheduledFor = formData.get('scheduledFor') as string || '';
        const durationMinutes = parseInt(formData.get('durationMinutes') as string || '30');
        const timePerQuestion = parseInt(formData.get('timePerQuestion') as string || '0');
        const prompt = formData.get('prompt') as string || '';
        const file = formData.get('file') as File | null;

        let fileContent = '';
        if (file) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                if (file.name.endsWith('.pdf')) {
                    const pdf = await import('pdf-parse');
                    const data = await pdf.default(buffer);
                    fileContent = data.text;
                } else {
                    fileContent = buffer.toString('utf-8');
                }
            } catch (fileError) {
                console.error('File processing error:', fileError);
                return NextResponse.json(
                    { error: 'Failed to process the uploaded file. It might be corrupted or in an unsupported format.' },
                    { status: 400 }
                );
            }
        }

        const questions = await generateQuestionsFromAI(prompt, fileContent);

        if (questions.length === 0) {
            return NextResponse.json(
                { error: 'No questions could be extracted or generated. Please check your file content.' },
                { status: 400 }
            );
        }

        // Apply time limit to all questions if specified
        if (timePerQuestion > 0) {
            questions.forEach(q => {
                q.time_limit_seconds = timePerQuestion;
            });
        }

        const assessmentId = generateId();
        let assignedTo = [];
        try {
            assignedTo = JSON.parse(assignedToStr);
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            // Fallback to empty array if parsing fails
            assignedTo = [];
        }

        // Save assessment with all metadata
        db.saveAssessment({
            id: assessmentId,
            title,
            description,
            questions,
            created_by: createdBy,
            created_at: new Date().toISOString(),
            scheduled_for: scheduledFor || undefined,
            duration_minutes: durationMinutes,
            assigned_to: assignedTo
        });

        return NextResponse.json({
            assessment_id: assessmentId,
            question_count: questions.length
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: String(error) },
            { status: 500 }
        );
    }
}


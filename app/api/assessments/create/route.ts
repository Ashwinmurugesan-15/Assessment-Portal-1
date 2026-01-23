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
        const scheduledFrom = formData.get('scheduledFrom') as string || '';
        const scheduledTo = formData.get('scheduledTo') as string || '';
        const durationMinutes = parseInt(formData.get('durationMinutes') as string || '30');
        const timePerQuestion = parseInt(formData.get('timePerQuestion') as string || '0');
        const difficulty = formData.get('difficulty') as string || 'medium';
        const prompt = formData.get('prompt') as string || '';
        const file = formData.get('file') as File | null;

        let fileContent = '';
        if (file) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                if (file.name.endsWith('.pdf')) {
                    try {
                        const pdf = await import('pdf-parse');
                        const data = await pdf.default(buffer);
                        fileContent = data.text;
                        console.log('PDF processed successfully, extracted text length:', fileContent.length);

                        if (!fileContent || fileContent.trim().length === 0) {
                            return NextResponse.json(
                                { error: 'The PDF appears to be empty or is image-based. Please use a text-based PDF or convert it to TXT/CSV format.' },
                                { status: 400 }
                            );
                        }
                    } catch (pdfError: any) {
                        console.error('PDF parsing error:', pdfError);
                        return NextResponse.json(
                            { error: `PDF parsing failed: ${pdfError.message || 'Unknown error'}. Try converting the PDF to TXT or CSV format.` },
                            { status: 400 }
                        );
                    }
                } else {
                    try {
                        fileContent = buffer.toString('utf-8');
                        console.log('Text file processed successfully, content length:', fileContent.length);

                        if (!fileContent || fileContent.trim().length === 0) {
                            return NextResponse.json(
                                { error: 'The uploaded file is empty. Please provide a file with questions.' },
                                { status: 400 }
                            );
                        }
                    } catch (textError: any) {
                        console.error('Text file reading error:', textError);
                        return NextResponse.json(
                            { error: `Failed to read the file: ${textError.message || 'Unknown error'}` },
                            { status: 400 }
                        );
                    }
                }
            } catch (fileError: any) {
                console.error('File processing error:', fileError);
                return NextResponse.json(
                    { error: `Failed to process the uploaded file: ${fileError.message || 'It might be corrupted or in an unsupported format.'}` },
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

        // Shuffle and limit to 150 questions as per requirement
        let finalQuestions = [...questions].sort(() => Math.random() - 0.5);
        if (finalQuestions.length > 150) {
            finalQuestions = finalQuestions.slice(0, 150);
        }

        // Apply time limit to all questions if specified
        if (timePerQuestion > 0) {
            finalQuestions.forEach(q => {
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
        await db.saveAssessment({
            assessment_id: assessmentId,
            title,
            description,
            difficulty,
            questions: finalQuestions,
            created_by: createdBy,
            created_at: new Date().toISOString(),
            scheduled_from: scheduledFrom || undefined,
            scheduled_to: scheduledTo || undefined,
            duration_minutes: durationMinutes,
            assigned_to: assignedTo
        });

        return NextResponse.json({
            assessment_id: assessmentId,
            question_count: finalQuestions.length
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: String(error) },
            { status: 500 }
        );
    }
}


'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Question, AnswerSubmission, GradingResult } from '@/types';
import { generateId } from '@/lib/utils';
import { Loader2, ArrowLeft, ArrowRight, Clock, Flag, XCircle } from 'lucide-react';

export default function TakeAssessment() {
    const params = useParams();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [startTime, setStartTime] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);
    const [alreadyAttempted, setAlreadyAttempted] = useState(false);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                // Get logged-in user ID
                const storedUser = localStorage.getItem('user');
                const userId = storedUser ? JSON.parse(storedUser).id : null;

                // Fetch assessment with user_id to check attempts
                const url = userId
                    ? `/api/assessments/${params.id}?user_id=${userId}`
                    : `/api/assessments/${params.id}`;

                const res = await fetch(url);

                if (!res.ok) {
                    const errorData = await res.json();
                    if (errorData.already_attempted) {
                        setAlreadyAttempted(true);
                        setLoading(false);
                        return;
                    }
                    throw new Error('Failed to load');
                }

                const data = await res.json();
                // Shuffle questions for each candidate
                const shuffled = [...data.questions].sort(() => Math.random() - 0.5);
                setQuestions(shuffled);
                setStartTime(new Date().toISOString());

                // Mark assessment as started to prevent retakes
                if (userId) {
                    await fetch(`/api/assessments/${params.id}/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId })
                    });
                }
            } catch (error) {
                alert('Assessment not found');
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchAssessment();
    }, [params.id, router]);

    useEffect(() => {
        if (!loading && startTime) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const start = new Date(startTime).getTime();
                setElapsedTime(Math.floor((now - start) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [loading, startTime]);

    const handleNext = useCallback(() => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            // If it's the last question, we need to trigger submit
            // We can't easily call handleSubmit here because of dependencies,
            // so we'll just set a flag or let the user click submit if time permits.
            // But if time is up, we MUST submit.
            // For now, let's just trigger the submit button click programmatically or refactor handleSubmit.
            document.getElementById('submit-btn')?.click();
        }
    }, [currentQuestion, questions.length]);

    // Per-question timer
    useEffect(() => {
        const currentQ = questions[currentQuestion];
        if (!currentQ || !currentQ.time_limit_seconds) {
            setQuestionTimeLeft(null);
            return;
        }

        setQuestionTimeLeft(currentQ.time_limit_seconds);

        const timer = setInterval(() => {
            setQuestionTimeLeft((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(timer);
                    handleNext(); // Auto-advance
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestion, questions, handleNext]);

    const handleOptionSelect = (qId: string, optId: string) => {
        setAnswers(prev => ({ ...prev, [qId]: optId }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            if (!confirm('You have unanswered questions. Are you sure you want to submit?')) return;
        }

        setSubmitting(true);
        const submissionTime = new Date().toISOString();

        const formattedAnswers: AnswerSubmission[] = Object.entries(answers).map(([qId, optId]) => ({
            question_id: qId,
            option_id: optId
        }));

        // Get the logged-in user's ID from localStorage
        const storedUser = localStorage.getItem('user');
        const userId = storedUser ? JSON.parse(storedUser).id : generateId();

        try {
            const res = await fetch(`/api/assessments/${params.id}/grade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessment_id: params.id,
                    user_id: userId,
                    answers: formattedAnswers,
                    time_started: startTime,
                    time_submitted: submissionTime
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Grading failed');
            }

            const result: GradingResult = await res.json();
            localStorage.setItem(`result_${params.id}`, JSON.stringify(result));
            router.push(`/assessment/${params.id}/result`);

        } catch (error: any) {
            console.error('Grading Error:', error);
            alert(`Error submitting assessment: ${error.message || 'Unknown error occurred'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-purple-600 mb-4" size={56} />
                <p className="text-gray-600 text-lg font-medium">Loading your assessment...</p>
            </div>
        );
    }

    // Show "Already Attempted" screen
    if (alreadyAttempted) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50">
                <div className="absolute inset-0 pattern-dots opacity-30" />

                <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
                    <div className="card-premium p-12 max-w-2xl w-full text-center">
                        {/* Icon */}
                        <div className="inline-flex p-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-6">
                            <XCircle className="text-orange-600" size={64} />
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl font-black text-gray-900 mb-4">
                            Assessment Already Completed
                        </h1>

                        {/* Message */}
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            You have already attempted this assessment.
                            <br />
                            If you need to retake it, please contact the examiner.
                        </p>

                        {/* OK Button */}
                        <button
                            onClick={() => router.push('/candidate/dashboard')}
                            className="px-8 py-4 btn-gradient font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            OK, Take Me Home
                        </button>

                        {/* Additional Info */}
                        <p className="text-sm text-gray-500 mt-8">
                            Need help? Contact your examiner for retake permission.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Safety check: ensure questions exist and currentQuestion is valid
    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-gray-600 text-lg font-medium">No questions available</p>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    // Additional safety check for currentQ
    if (!currentQ) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-gray-600 text-lg font-medium">Error loading question</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-5xl mx-auto px-6 py-5">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">Assessment</h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                                    <Clock size={18} className="text-purple-600" />
                                    <span className="font-mono font-bold text-purple-900">{formatTime(elapsedTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Flag size={18} className="text-blue-600" />
                                    <span className="font-bold text-blue-900">{answeredCount}/{questions.length}</span>
                                </div>
                                {questionTimeLeft !== null && (
                                    <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${questionTimeLeft < 10 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                                        }`}>
                                        <Clock size={18} />
                                        <span className="font-mono font-bold">{formatTime(questionTimeLeft)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="progress-gradient h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-sm font-semibold text-gray-600 min-w-[80px] text-right">
                                {currentQuestion + 1} of {questions.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Question */}
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <div className="card-premium p-8 md:p-12 mb-8">
                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <span className="text-white font-bold text-lg">{currentQuestion + 1}</span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
                                    {currentQ.text}
                                </h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {currentQ.options.map((opt) => {
                                const isSelected = answers[currentQ.id] === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleOptionSelect(currentQ.id, opt.id)}
                                        className={`option-card w-full text-left p-5 ${isSelected ? 'selected' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                                                }`}>
                                                {isSelected && <div className="w-3 h-3 rounded-full bg-white" />}
                                            </div>
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="font-bold text-gray-500 text-lg">{opt.id}</span>
                                                <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {opt.text}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation - Sequential Only */}
                    <div className="flex justify-end items-center gap-4">
                        {currentQuestion === questions.length - 1 ? (
                            <button
                                id="submit-btn"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-8 py-3 btn-gradient font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <span>Submit Assessment</span>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={!answers[currentQ.id]} // Force answer before next? User said "complete one question", implying answering.
                                className="px-6 py-3 btn-gradient font-semibold rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ArrowRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

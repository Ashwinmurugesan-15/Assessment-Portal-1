'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Question, AnswerSubmission, GradingResult } from '@/types';
import { generateId } from '@/lib/utils';
import { Loader2, ArrowLeft, ArrowRight, Clock, Flag, XCircle } from 'lucide-react';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';

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

    // Tab Switching State
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [terminationReason, setTerminationReason] = useState<string | null>(null);

    const [alreadyAttempted, setAlreadyAttempted] = useState(false);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                // Get logged-in user ID
                const storedUser = localStorage.getItem('user');
                const userId = storedUser ? JSON.parse(storedUser).id : null;

                // Fetch assessment with user_id to check attempts
                const url = userId
                    ? getApiUrl(`/assessments/${params.id}?user_id=${userId}`)
                    : getApiUrl(`/assessments/${params.id}`);

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
                // Shuffle questions for each candidate and limit to 100 at most
                let shuffled = [...data.questions].sort(() => Math.random() - 0.5);
                if (shuffled.length > 100) {
                    shuffled = shuffled.slice(0, 100);
                }
                setQuestions(shuffled);
                setStartTime(new Date().toISOString());

                // Mark assessment as started to prevent retakes
                if (userId) {
                    await fetch(getApiUrl(`/assessments/${params.id}/start`), {
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

    // Tab Switch Detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !submitting && !alreadyAttempted) {
                handleTabSwitch();
            }
        };

        const handleTabSwitch = () => {
            setTabSwitchCount(prev => {
                const newCount = prev + 1;

                // Allow 3 warnings, terminate on 4th violation
                if (newCount >= 4) {
                    setTerminationReason('Terminated due to excessive tab switching');
                    handleSubmit(true, 'Terminated due to excessive tab switching');
                } else {
                    setShowWarning(true);
                }

                return newCount;
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [submitting, alreadyAttempted, loading]);

    const handleNext = useCallback(() => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    }, [currentQuestion, questions.length]);

    const handlePrev = useCallback(() => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    }, [currentQuestion]);



    const handleOptionSelect = (qId: string, optId: string) => {
        setAnswers(prev => ({ ...prev, [qId]: optId }));
    };

    const handleSubmit = async (autoSubmit = false, reason?: string) => {
        if (!autoSubmit && Object.keys(answers).length < questions.length) {
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
            const res = await fetch(getApiUrl(`/assessments/${params.id}/grade`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessment_id: params.id,
                    user_id: userId,
                    answers: formattedAnswers,
                    time_started: startTime,
                    time_submitted: submissionTime,
                    tab_switch_count: autoSubmit ? 4 : tabSwitchCount, // If auto-submitting, it means we hit the limit
                    termination_reason: reason || null
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
            <div className="min-h-screen flex flex-col items-center justify-center dark:bg-gray-950">
                <Loader2 className="animate-spin text-purple-600 mb-4" size={56} />
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading your assessment...</p>
            </div>
        );
    }

    // Show "Already Attempted" screen
    if (alreadyAttempted) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                <div className="absolute inset-0 pattern-dots opacity-30" />

                <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
                    <div className="card-premium p-12 max-w-2xl w-full text-center">
                        {/* Icon */}
                        <div className="inline-flex p-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-6">
                            <XCircle className="text-orange-600" size={64} />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Assessment Already Completed
                        </h1>

                        {/* Message */}
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            You have already attempted this assessment.
                            <br />
                            If you need to retake it, please contact the examiner.
                        </p>

                        {/* OK Button */}
                        <button
                            onClick={() => router.push('/candidate/dashboard')}
                            className="px-6 py-3 btn-gradient font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            OK, Take Me Home
                        </button>

                        {/* Additional Info */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
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
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No questions available</p>
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
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Error loading question</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden dark:bg-gray-950">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Assessment</h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 rounded-lg">
                                    <Clock size={18} className="text-purple-600 dark:text-purple-400" />
                                    <span className="font-mono font-bold text-purple-900 dark:text-purple-100">{formatTime(elapsedTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 rounded-lg">
                                    <Flag size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span className="font-bold text-blue-900 dark:text-blue-100">{answeredCount}/{questions.length}</span>
                                </div>
                                <ThemeToggle />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="progress-gradient h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
                                {currentQuestion + 1} of {questions.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Question */}
                <div className="max-w-5xl mx-auto px-6 py-12">
                    {/* Question Palette */}
                    <div className="mb-8 overflow-x-auto pb-2">
                        <div className="flex flex-wrap gap-2 justify-center min-w-max md:min-w-0">
                            {questions.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = currentQuestion === idx;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestion(idx)}
                                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border-2 flex items-center justify-center ${isCurrent
                                            ? 'border-purple-600 bg-purple-600 text-white shadow-lg scale-110'
                                            : isAnswered
                                                ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card-premium p-6 md:p-8 mb-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                                <span className="text-white font-bold text-base">{currentQuestion + 1}</span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
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
                                                <span className="font-bold text-gray-500 dark:text-gray-400 text-base">{opt.id}</span>
                                                <span className={`font-medium text-sm ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {opt.text}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentQuestion === 0 || submitting}
                        className="px-6 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                        <ArrowLeft size={20} />
                        Previous
                    </button>

                    {currentQuestion === questions.length - 1 ? (
                        <button
                            id="submit-btn"
                            onClick={() => handleSubmit(false)}
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
                            className="px-6 py-3 btn-gradient font-semibold rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ArrowRight size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Switch Warning Modal */}
            {showWarning && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="card-premium p-8 max-w-md w-full animate-scale-in border-l-4 border-orange-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-orange-100 rounded-full">
                                <Flag className="text-orange-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Warning!</h2>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                            Tab switching is not allowed during the assessment.
                        </p>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                            <p className="font-bold text-orange-800">
                                Warning {tabSwitchCount} of 3
                            </p>
                            <p className="text-sm text-orange-700 mt-1">
                                If you switch tabs {4 - tabSwitchCount} more time(s), your test will be automatically terminated.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowWarning(false)}
                            className="w-full py-3 bg-gray-900 dark:bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-700 transition-all"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

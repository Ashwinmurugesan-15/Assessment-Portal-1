'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GradingResult } from '@/types';
import { CheckCircle, XCircle, BarChart3, Home, Trophy, Target, Zap, Award } from 'lucide-react';
import Link from 'next/link';

export default function AssessmentResult() {
    const params = useParams();
    const router = useRouter();
    const [result, setResult] = useState<GradingResult | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Get user role from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setUserRole(user.role);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        const stored = localStorage.getItem(`result_${params.id}`);
        if (stored) {
            setResult(JSON.parse(stored));
        } else {
            router.push('/');
        }
    }, [params.id, router]);

    if (!result) return null;

    const scorePercentage = Math.round(result.score);
    const isPerfect = scorePercentage === 100;
    const isExcellent = scorePercentage >= 80;
    const isGood = scorePercentage >= 60;

    // Determine the home path based on user role
    const getHomePath = () => {
        switch (userRole) {
            case 'candidate':
                return '/candidate/dashboard';
            case 'examiner':
                return '/examiner/dashboard';
            default:
                return '/';
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 pattern-grid opacity-30" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20" />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex p-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl mb-6 shadow-lg">
                        {isPerfect ? (
                            <Trophy className="text-yellow-500" size={64} />
                        ) : isExcellent ? (
                            <Award className="text-purple-600" size={64} />
                        ) : (
                            <Target className="text-blue-600" size={64} />
                        )}
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 mb-3">
                        {isPerfect ? 'Perfect Score!' : isExcellent ? 'Excellent Work!' : isGood ? 'Good Job!' : 'Keep Learning!'}
                    </h1>
                    <p className="text-xl text-gray-600">
                        {isPerfect
                            ? 'You aced this assessment! Outstanding performance.'
                            : isExcellent
                                ? 'You demonstrated strong knowledge in this area.'
                                : isGood
                                    ? 'You showed good understanding. Review the feedback below.'
                                    : 'Practice makes perfect. Review your answers to improve.'}
                    </p>
                </div>

                {/* Score Card */}
                <div className="gradient-border mb-8">
                    <div className="card-premium p-10 text-center relative z-10">
                        <div className={`text-8xl font-black mb-6 ${isPerfect ? 'text-gradient' : 'text-gray-900'
                            }`}>
                            {scorePercentage}%
                        </div>
                        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                            <div className="stat-card card-premium p-6">
                                <div className="text-3xl font-bold text-green-600 mb-1">{result.correct_count}</div>
                                <div className="text-sm text-gray-600 font-medium">Correct</div>
                            </div>
                            <div className="stat-card card-premium p-6">
                                <div className="text-3xl font-bold text-red-600 mb-1">{result.total_questions - result.correct_count}</div>
                                <div className="text-sm text-gray-600 font-medium">Incorrect</div>
                            </div>
                            <div className="stat-card card-premium p-6">
                                <div className="text-3xl font-bold text-blue-600 mb-1">{Math.round(result.analytics.time_taken_seconds)}s</div>
                                <div className="text-sm text-gray-600 font-medium">Time</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="card-premium p-6 text-center hover:shadow-xl transition-shadow">
                        <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Target className="text-purple-600" size={28} />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {Math.round(result.analytics.accuracy_percent)}%
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Accuracy Rate</div>
                    </div>

                    <div className="card-premium p-6 text-center hover:shadow-xl transition-shadow">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Zap className="text-blue-600" size={28} />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {Math.round(result.analytics.avg_time_per_question_seconds)}s
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Avg per Question</div>
                    </div>

                    <div className="card-premium p-6 text-center hover:shadow-xl transition-shadow">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="text-green-600" size={28} />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {result.total_questions}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Total Questions</div>
                    </div>
                </div>

                {/* Detailed Results */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <BarChart3 className="text-white" size={20} />
                        </div>
                        Detailed Breakdown
                    </h2>

                    <div className="space-y-4">
                        {result.detailed.map((item, idx) => (
                            <div
                                key={item.question_id}
                                className={`card-premium p-6 border-l-4 ${item.is_correct ? 'border-l-green-500' : 'border-l-red-500'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-600">
                                            Q{idx + 1}
                                        </span>
                                        {item.is_correct ? (
                                            <span className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg text-green-700 text-sm font-semibold">
                                                <CheckCircle size={16} /> Correct
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-lg text-red-700 text-sm font-semibold">
                                                <XCircle size={16} /> Incorrect
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm font-bold text-gray-500">
                                        {item.points_awarded} / 1 point
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div className={`p-4 rounded-xl border-2 ${item.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                        }`}>
                                        <span className="text-xs font-semibold text-gray-600 block mb-1">Your Answer</span>
                                        <span className={`font-bold text-lg ${item.is_correct ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            Option {item.submitted || 'Not answered'}
                                        </span>
                                    </div>
                                    {!item.is_correct && (
                                        <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                                            <span className="text-xs font-semibold text-gray-600 block mb-1">Correct Answer</span>
                                            <span className="text-green-700 font-bold text-lg">
                                                Option {item.correct}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {item.explanation && (
                                    <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                                        <div className="flex items-start gap-2">
                                            <span className="text-purple-600 font-bold text-sm">💡</span>
                                            <div>
                                                <span className="text-purple-700 font-semibold text-sm block mb-1">Explanation</span>
                                                <p className="text-gray-700 text-sm leading-relaxed">{item.explanation}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center">
                    <Link
                        href={getHomePath()}
                        className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-center transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Home size={20} />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Clock, BookOpen, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';

interface Assessment {
    id: string;
    title: string;
    description?: string;
    created_at: string;
    scheduled_for?: string;
    duration_minutes?: number;
    assigned_to: string[];
    questions: any[];
}

interface Result {
    user_id: string;
    user_name?: string;
    score: number;
    max_score: number;
    graded_at: string;
}

export default function ExaminerAssessmentView() {
    const params = useParams();
    const router = useRouter();
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'examiner') {
            router.push('/');
            return;
        }

        fetchAssessmentDetails();
    }, [params.id, router]);

    const fetchAssessmentDetails = async () => {
        try {
            const assessmentRes = await fetch(`/api/examiner/assessment/${params.id}`);
            if (assessmentRes.ok) {
                const data = await assessmentRes.json();
                setAssessment(data.assessment);
                setResults(data.results || []);
            }
        } catch (error) {
            console.error('Error fetching assessment:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not scheduled';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateStats = () => {
        if (results.length === 0) return { avgScore: 0, highScore: 0, lowScore: 0 };
        const scores = results.map(r => (r.score / r.max_score) * 100);
        return {
            avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            highScore: Math.round(Math.max(...scores)),
            lowScore: Math.round(Math.min(...scores))
        };
    };

    const handleGrantRetake = async (candidateId: string, candidateName: string) => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const currentUser = JSON.parse(storedUser);

        const confirmGrant = confirm(
            `Grant retake permission to "${candidateName}"?\n\nThis will allow them to take the assessment one more time.`
        );

        if (!confirmGrant) return;

        try {
            const res = await fetch(`/api/examiner/assessment/${params.id}/retake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidate_id: candidateId,
                    examiner_id: currentUser.id
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to grant retake permission');
            }

            const data = await res.json();
            alert(data.message);
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h2>
                    <Link href="/examiner/dashboard" className="text-purple-600 hover:text-purple-700">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const stats = calculateStats();

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <Link
                            href="/examiner/dashboard"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-2"
                        >
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
                            {assessment.description && (
                                <p className="text-gray-600 text-sm mt-1">{assessment.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid md:grid-cols-4 gap-6 mb-12">
                        <div className="card-premium p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <BookOpen className="text-purple-600" size={20} />
                                <span className="text-sm font-semibold text-gray-600">Questions</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{assessment.questions.length}</div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-blue-600" size={20} />
                                <span className="text-sm font-semibold text-gray-600">Assigned</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{assessment.assigned_to.length}</div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Award className="text-green-600" size={20} />
                                <span className="text-sm font-semibold text-gray-600">Completed</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{results.length}</div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="text-orange-600" size={20} />
                                <span className="text-sm font-semibold text-gray-600">Duration</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{assessment.duration_minutes || 30}m</div>
                        </div>
                    </div>

                    {results.length > 0 && (
                        <div className="card-premium p-8 mb-12">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Statistics</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-blue-600 mb-2">{stats.avgScore}%</div>
                                    <div className="text-sm text-gray-600">Average Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-green-600 mb-2">{stats.highScore}%</div>
                                    <div className="text-sm text-gray-600">Highest Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-orange-600 mb-2">{stats.lowScore}%</div>
                                    <div className="text-sm text-gray-600">Lowest Score</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card-premium p-8 mb-12">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Questions</h2>
                        <div className="space-y-6">
                            {assessment.questions.map((q, idx) => (
                                <div key={q.id} className="border-l-4 border-purple-500 pl-6 py-2">
                                    <div className="flex items-start gap-3">
                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">
                                            Q{idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-gray-900 font-medium mb-3">{q.text}</p>
                                            <div className="grid md:grid-cols-2 gap-2">
                                                {q.options.map((opt: any) => (
                                                    <div
                                                        key={opt.id}
                                                        className={`p-3 rounded-lg border-2 ${opt.id === q.correct_option_id
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-200 bg-gray-50'
                                                            }`}
                                                    >
                                                        <span className="font-semibold text-gray-700">{opt.id}.</span> {opt.text}
                                                        {opt.id === q.correct_option_id && (
                                                            <span className="ml-2 text-green-600 text-sm font-semibold">✓ Correct</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card-premium overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Submission Results</h2>
                        </div>
                        {results.length === 0 ? (
                            <div className="p-12 text-center">
                                <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
                                <p className="text-gray-600">No submissions yet</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Candidate</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Score</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Percentage</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Submitted</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {results.map((result, idx) => {
                                        const percentage = Math.round((result.score / result.max_score) * 100);
                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-gray-900 font-medium">
                                                    {result.user_name || `Unknown User (${result.user_id.slice(0, 8)})`}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {result.score}/{result.max_score}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${percentage >= 80 ? 'bg-green-100 text-green-700' :
                                                        percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                                                            percentage >= 40 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {percentage}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{formatDate(result.graded_at)}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleGrantRetake(result.user_id, result.user_name || `User ${result.user_id.slice(0, 8)}`)}
                                                        className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <Award size={16} />
                                                        Grant Retake
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

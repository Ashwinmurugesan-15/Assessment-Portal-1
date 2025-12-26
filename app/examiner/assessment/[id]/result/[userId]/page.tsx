'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, Award, AlertCircle, Download } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DetailedResult {
    assessment_id: string;
    user_id: string;
    result: {
        score: number;
        max_score: number;
        correct_count: number;
        total_questions: number;
        detailed: Array<{
            question_id: string;
            submitted: string;
            correct: string;
            is_correct: boolean;
            points_awarded: number;
            explanation?: string;
        }>;
        analytics: {
            time_taken_seconds: number;
            accuracy_percent: number;
            avg_time_per_question_seconds: number;
        };
        graded_at: string;
        tab_switch_count?: number;
        termination_reason?: string;
    };
    timestamp: string;
}

interface PageData {
    assessment: {
        id: string;
        title: string;
        questions: any[];
    };
    user: {
        id: string;
        name: string;
        email: string;
    };
    results: DetailedResult[];
}

export default function CandidateDetailView() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeAttempt, setActiveAttempt] = useState(0);
    const [showAllDetails, setShowAllDetails] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'admin') {
            router.push(`/examiner/assessment/${params.id}`);
            return;
        }

        const fetchDetails = async () => {
            try {
                const res = await fetch(getApiUrl(`/examiner/assessment/${params.id}/result/${params.userId}`));
                if (!res.ok) throw new Error('Failed to fetch details');
                const jsonData = await res.json();
                setData(jsonData);
                // Set active attempt to the latest one by default
                if (jsonData.results && jsonData.results.length > 0) {
                    setActiveAttempt(jsonData.results.length - 1);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to load candidate details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [params.id, params.userId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    if (!data || data.results.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Found</h2>
                <p className="text-gray-600 mb-6">This candidate has not completed the assessment yet.</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const currentResult = data.results[activeAttempt];
    const percentage = Math.round((currentResult.result.score / currentResult.result.max_score) * 100);

    const downloadReport = () => {
        try {
            if (!data) return;
            const result = data.results[activeAttempt];

            // Prepare data for Excel
            const reportData = [
                ['Candidate Report'],
                ['Name', data.user.name],
                ['Email', data.user.email],
                ['Assessment', data.assessment.title],
                ['Score', `${result.result.score}/${result.result.max_score}`],
                ['Date', new Date(result.result.graded_at).toLocaleString()],
                [],
                ['Question', 'Candidate Answer', 'Correct Answer', 'Status', 'Points']
            ];

            result.result.detailed.forEach((item) => {
                const q = data.assessment.questions.find(q => q.id === item.question_id);
                reportData.push([
                    (q?.text || ''),
                    (item.submitted || ''),
                    (item.correct || ''),
                    item.is_correct ? 'Correct' : 'Incorrect',
                    item.points_awarded.toString()
                ]);
            });

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(reportData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Report');

            // Generate Excel file
            XLSX.writeFile(wb, `${data.user.name}_${data.assessment.title}_Report.xlsx`);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download report. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
            <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none" />

            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <Link
                            href={`/examiner/assessment/${params.id}`}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Assessment
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {data.user.name}
                            </h1>
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                <span>{data.user.email}</span>
                                <span>•</span>
                                <span>{data.assessment.title}</span>
                            </div>
                        </div>

                        {/* Attempt Switcher */}
                        {data.results.length > 1 && (
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                {data.results.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveAttempt(idx)}
                                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeAttempt === idx
                                            ? 'bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        Attempt {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <button
                                onClick={downloadReport}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                            >
                                <Download size={18} />
                                Download Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Score Overview */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="card-premium p-6 flex flex-col items-center justify-center text-center">
                        <div className={`text-5xl font-black mb-2 ${percentage >= 80 ? 'text-green-600' :
                            percentage >= 60 ? 'text-blue-600' :
                                percentage >= 40 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                            {percentage}%
                        </div>
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Score</div>
                    </div>

                    <div className="card-premium p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Award size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {currentResult.result.score} / {currentResult.result.max_score}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">POINTS EARNED</div>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>

                    <div className="card-premium p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {Math.round(currentResult.result.analytics.time_taken_seconds / 60)}m
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">TIME TAKEN</div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Avg {Math.round(currentResult.result.analytics.avg_time_per_question_seconds)}s / question
                        </div>
                    </div>

                    <div className="card-premium p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {new Date(currentResult.result.graded_at).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">SUBMITTED ON</div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(currentResult.result.graded_at).toLocaleTimeString()}
                        </div>
                    </div>

                    {/* Security / Tab Switch Info */}
                    <div className={`card-premium p-6 ${currentResult.result.termination_reason ? 'border-2 border-red-500 bg-red-50' : ''}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${currentResult.result.termination_reason ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {currentResult.result.tab_switch_count || 0}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">TAB SWITCHES</div>
                            </div>
                        </div>
                        {currentResult.result.termination_reason && (
                            <div className="text-sm font-bold text-red-600 mt-2">
                                {currentResult.result.termination_reason}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="card-premium p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Detailed Breakdown
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-full font-normal">
                                {currentResult.result.total_questions} Questions
                            </span>
                        </h2>
                        <button
                            onClick={() => setShowAllDetails(!showAllDetails)}
                            className="text-sm font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            {showAllDetails ? 'View Less' : 'View More'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(showAllDetails ? currentResult.result.detailed : currentResult.result.detailed.slice(0, 1)).map((item, idx) => {
                            const questionData = data.assessment.questions.find(q => q.id === item.question_id);

                            return (
                                <div
                                    key={idx}
                                    className={`border rounded-xl overflow-hidden transition-all duration-300 ${item.is_correct ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
                                        }`}
                                >
                                    {/* Question Header (Always Visible) */}
                                    <div className="p-4 flex items-start gap-4">
                                        <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${item.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            Q{idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                                                    {questionData?.text || 'Question text not available'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {item.is_correct ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                                                        <CheckCircle size={12} /> Correct
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                                                        <XCircle size={12} /> Incorrect
                                                    </span>
                                                )}
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    {item.points_awarded} / 1 Point
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <div className="border-t border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 animate-fade-in">
                                        <div className="p-4 grid md:grid-cols-2 gap-4">
                                            {/* Candidate Answer */}
                                            <div className={`p-3 rounded-lg border ${item.is_correct
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                                }`}>
                                                <span className="text-xs font-bold uppercase tracking-wider mb-1 block opacity-70 dark:text-gray-300">
                                                    Candidate Answer
                                                </span>
                                                <div className="font-medium">
                                                    {item.submitted ? (
                                                        <span className={item.is_correct ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}>
                                                            Option {item.submitted}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 dark:text-gray-400 italic">Not Answered</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Correct Answer */}
                                            <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-1 block opacity-70">
                                                    Correct Answer
                                                </span>
                                                <div className="font-medium text-blue-900 dark:text-blue-300">
                                                    Option {item.correct}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Explanation */}
                                        {item.explanation && (
                                            <div className="px-4 pb-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                                                    <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Explanation:</span>
                                                    <p className="text-gray-600 dark:text-gray-400">{item.explanation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

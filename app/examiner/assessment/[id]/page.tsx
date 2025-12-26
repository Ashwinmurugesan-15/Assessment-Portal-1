'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Clock, BookOpen, TrendingUp, Award, Download, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import NextImage from 'next/image';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';

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
    user_email?: string;
    score: number;
    max_score: number;
    graded_at: string;
    retake_granted?: boolean;
    attempt_number?: number;
    is_reattempt?: boolean;
}

export default function ExaminerAssessmentView() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [allCandidates, setAllCandidates] = useState<any[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [updatingAssignments, setUpdatingAssignments] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'examiner' && parsedUser.role !== 'admin') {
            router.push('/');
            return;
        }

        setUser(parsedUser);
        fetchAssessmentDetails();
        fetchCandidates();
    }, [params.id, router]);

    const fetchCandidates = async () => {
        try {
            const res = await fetch(getApiUrl('/examiner/candidates'));
            if (res.ok) {
                const data = await res.json();
                setAllCandidates(data.candidates || []);
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
        }
    };

    const handleUpdateAssignments = async () => {
        setUpdatingAssignments(true);
        try {
            const res = await fetch(getApiUrl(`/examiner/assessment/${params.id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: selectedCandidates })
            });

            if (!res.ok) throw new Error('Failed to update assignments');

            const data = await res.json();
            setAssessment(data.assessment);
            setShowAssignModal(false);
            alert('Assignments updated successfully');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUpdatingAssignments(false);
        }
    };

    const toggleCandidate = (candidateId: string) => {
        setSelectedCandidates(prev =>
            prev.includes(candidateId)
                ? prev.filter(id => id !== candidateId)
                : [...prev, candidateId]
        );
    };

    const fetchAssessmentDetails = async () => {
        try {
            const assessmentRes = await fetch(getApiUrl(`/examiner/assessment/${params.id}`));
            if (assessmentRes.ok) {
                const data = await assessmentRes.json();
                setAssessment(data.assessment);
                setResults(data.results || []);
                setSelectedCandidates(data.assessment.assigned_to || []);
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
            const res = await fetch(getApiUrl(`/examiner/assessment/${params.id}/retake`), {
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

            // Update local state to reflect the change
            setResults(prev => prev.map(r =>
                r.user_id === candidateId ? { ...r, retake_granted: true } : r
            ));
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const downloadAssessmentReport = () => {
        if (!assessment || results.length === 0) return;

        try {
            // Prepare data for Excel
            const reportData = [
                ['Assessment Report'],
                ['Title', assessment.title],
                ['Total Candidates', results.length],
                ['Generated At', new Date().toLocaleString()],
                [],
                ['Candidate Name', 'Email', 'Score', 'Max Score', 'Percentage', 'Attempt', 'Submitted At']
            ];

            results.forEach(r => {
                const percentage = Math.round((r.score / r.max_score) * 100);
                reportData.push([
                    r.user_name || 'Unknown',
                    r.user_email || 'N/A',
                    r.score,
                    r.max_score,
                    `${percentage}%`,
                    r.attempt_number || 1,
                    new Date(r.graded_at).toLocaleString()
                ]);
            });

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(reportData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Results');

            // Generate Excel file
            XLSX.writeFile(wb, `${assessment.title}_Full_Report.xlsx`);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download report.');
        }
    };
    const downloadIndividualReport = async (result: any) => {
        if (!assessment) return;

        try {
            // Fetch full details for this specific result to get questions/answers
            const res = await fetch(getApiUrl(`/examiner/assessment/${params.id}/result/${result.user_id}`));
            if (!res.ok) throw new Error('Failed to fetch detailed result');

            const data = await res.json();
            // Find the specific attempt if multiple exist
            const specificResult = data.results.find((r: any) =>
                new Date(r.timestamp).getTime() === new Date(result.graded_at).getTime()
            ) || data.results[data.results.length - 1];

            const reportData = [
                ['Individual Candidate Report'],
                ['Assessment', assessment.title],
                ['Candidate Name', result.user_name],
                ['Email', result.user_email],
                ['Score', `${result.score}/${result.max_score} (${Math.round((result.score / result.max_score) * 100)}%)`],
                ['Attempt', result.attempt_number || 1],
                ['Submitted At', new Date(result.graded_at).toLocaleString()],
                [],
                ['Question', 'Candidate Answer', 'Correct Answer', 'Status', 'Points', 'Explanation']
            ];

            specificResult.result.detailed.forEach((d: any, idx: number) => {
                reportData.push([
                    `Q${idx + 1}: ${d.question_text}`,
                    d.selected_option_text || 'No Answer',
                    d.correct_option_text,
                    d.is_correct ? 'Correct' : 'Incorrect',
                    d.points_awarded,
                    d.explanation || ''
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(reportData);

            // Set column widths
            ws['!cols'] = [
                { wch: 50 }, // Question
                { wch: 30 }, // Candidate Answer
                { wch: 30 }, // Correct Answer
                { wch: 10 }, // Status
                { wch: 10 }, // Points
                { wch: 50 }  // Explanation
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Result');
            XLSX.writeFile(wb, `${result.user_name.replace(/\s+/g, '_')}_${assessment.title.replace(/\s+/g, '_')}_Report.xlsx`);
        } catch (error) {
            console.error('Error downloading individual report:', error);
            alert('Failed to download individual report');
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
        <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="px-6 py-4">
                        <Link
                            href="/examiner/dashboard"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium mb-2"
                        >
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-4">
                                <NextImage
                                    src="/logo.png"
                                    alt="GuhaTek Logo"
                                    width={100}
                                    height={35}
                                    className="h-9 w-auto object-contain dark:brightness-0 dark:invert"
                                    priority
                                />
                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{assessment.title}</h1>
                                    {assessment.description && (
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{assessment.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors shadow-sm"
                                >
                                    <Users size={18} />
                                    Assign Candidates
                                </button>
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={downloadAssessmentReport}
                                        disabled={results.length === 0}
                                        className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors shadow-sm ${results.length === 0
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                            }`}
                                    >
                                        <Download size={18} />
                                        Download Full Report
                                    </button>
                                )}
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid md:grid-cols-4 gap-6 mb-12">
                        <div className="card-premium p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <BookOpen className="text-purple-600" size={20} />
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Questions</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{assessment.questions.length}</div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-blue-600" size={20} />
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Assigned</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{assessment.assigned_to.length}</div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Award className="text-green-600" size={20} />
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Completed</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{results.length}</div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="text-orange-600" size={20} />
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Duration</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{assessment.duration_minutes || 30}m</div>
                        </div>
                    </div>

                    {results.length > 0 && user?.role === 'admin' && (
                        <div className="card-premium p-8 mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance Statistics</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-blue-600 mb-2">{stats.avgScore}%</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-green-600 mb-2">{stats.highScore}%</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Highest Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-orange-600 mb-2">{stats.lowScore}%</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Lowest Score</div>
                                </div>
                            </div>
                        </div>
                    )}



                    <div className="card-premium overflow-hidden mb-12">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submission Results</h2>
                        </div>
                        {results.length === 0 ? (
                            <div className="p-12 text-center">
                                <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
                                <p className="text-gray-600 dark:text-gray-400">No submissions yet</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Candidate</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Score</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Percentage</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Submitted</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {results.map((result, idx) => {
                                        const percentage = Math.round((result.score / result.max_score) * 100);
                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">
                                                            {result.user_name || `Unknown User (${result.user_id.slice(0, 8)})`}
                                                        </span>
                                                        {result.is_reattempt && (
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                                                                Attempt {result.attempt_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
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
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(result.graded_at)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {user?.role === 'admin' && (
                                                            <>
                                                                <Link
                                                                    href={`/examiner/assessment/${params.id}/result/${result.user_id}`}
                                                                    className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md text-sm font-bold transition-colors"
                                                                >
                                                                    View Details
                                                                </Link>
                                                                <button
                                                                    onClick={() => downloadIndividualReport(result)}
                                                                    className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                                                                    title="Download Individual Report"
                                                                >
                                                                    <Download size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {(!result.attempt_number || result.attempt_number === Math.max(...results.filter(r => r.user_id === result.user_id).map(r => r.attempt_number || 1))) ? (
                                                            <button
                                                                onClick={() => handleGrantRetake(result.user_id, result.user_name || `User ${result.user_id.slice(0, 8)}`)}
                                                                disabled={result.retake_granted}
                                                                className={`px-3 py-1 font-semibold rounded-md transition-colors flex items-center gap-2 text-sm ${result.retake_granted
                                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                                    : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400'
                                                                    }`}
                                                            >
                                                                <Award size={14} />
                                                                {result.retake_granted ? 'Granted' : 'Grant Retake'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 dark:text-gray-500 font-medium">-</span>
                                                        )}
                                                    </div>
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

            {/* Assign Candidates Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="card-premium p-8 max-w-2xl w-full animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users className="text-purple-600" />
                                Assign Candidates
                            </h2>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Select candidates to assign to this assessment.</p>
                            <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                                {allCandidates.map((candidate) => (
                                    <label
                                        key={candidate.id}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCandidates.includes(candidate.id)
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCandidates.includes(candidate.id)}
                                            onChange={() => toggleCandidate(candidate.id)}
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{candidate.name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{candidate.email}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateAssignments}
                                disabled={updatingAssignments}
                                className="flex-1 px-4 py-3 btn-gradient font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {updatingAssignments ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Updating...
                                    </>
                                ) : (
                                    'Save Assignments'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

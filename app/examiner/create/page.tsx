'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Sparkles, FileText, Loader2, Wand2, ArrowLeft, Users, Calendar, Clock, Info, CheckCircle2, Download } from 'lucide-react';
import NextImage from 'next/image';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Candidate {
    id: string;
    name: string;
    email: string;
}

export default function CreateAssessmentPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [mode, setMode] = useState<'upload' | 'generate'>('generate');
    const [loading, setLoading] = useState(false);
    const [showGuide, setShowGuide] = useState(true);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        prompt: '',
        file: null as File | null,
        selectedCandidates: [] as string[],
        scheduledFrom: '',
        scheduledTo: '',
        durationMinutes: 30,
        timePerQuestion: 0,
        difficulty: 'medium' as 'easy' | 'medium' | 'hard'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'admin') {
            router.push('/');
            return;
        }

        setUser(parsedUser);
        fetchCandidates();
    }, [router]);

    const fetchCandidates = async () => {
        try {
            const res = await fetch(getApiUrl('/examiner/candidates'));
            if (res.ok) {
                const data = await res.json();
                setCandidates(data.candidates || []);
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('createdBy', user!.id);
        formDataToSend.append('assignedTo', JSON.stringify(formData.selectedCandidates));
        formDataToSend.append('scheduledFrom', formData.scheduledFrom);
        formDataToSend.append('scheduledTo', formData.scheduledTo);
        formDataToSend.append('durationMinutes', formData.durationMinutes.toString());
        formDataToSend.append('timePerQuestion', formData.timePerQuestion.toString());
        formDataToSend.append('difficulty', formData.difficulty);

        if (mode === 'generate') {
            formDataToSend.append('prompt', formData.prompt);
        } else if (formData.file) {
            formDataToSend.append('file', formData.file);
        }

        try {
            const res = await fetch(getApiUrl('/assessments/create'), {
                method: 'POST',
                body: formDataToSend,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.details || 'Failed to create assessment');
            }

            router.push('/admin');
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleCandidate = (candidateId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedCandidates: prev.selectedCandidates.includes(candidateId)
                ? prev.selectedCandidates.filter(id => id !== candidateId)
                : [...prev.selectedCandidates, candidateId]
        }));
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="px-6 py-4">
                        <button
                            onClick={() => router.push('/admin')}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium mb-2"
                        >
                            <ArrowLeft size={20} />
                            Back to Admin Dashboard
                        </button>
                        <div className="flex items-center justify-between">
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
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">VinavalAI</h1>
                                        <span className="text-gray-400 dark:text-gray-600">•</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Assessment Portal</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Create New Assessment</p>
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="card-premium p-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Assessment Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                        placeholder="e.g., React Fundamentals Quiz"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full h-24 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none resize-none"
                                        placeholder="Brief description of the assessment..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Difficulty Level
                                    </label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <Calendar size={16} className="inline mr-1" />
                                            Valid From (Optional)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.scheduledFrom}
                                            onChange={(e) => setFormData({ ...formData, scheduledFrom: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <Calendar size={16} className="inline mr-1" />
                                            Valid Until (Optional)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.scheduledTo}
                                            onChange={(e) => setFormData({ ...formData, scheduledTo: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <Clock size={16} className="inline mr-1" />
                                            Duration (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.durationMinutes}
                                            onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                            min="5"
                                            step="5"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            <Clock size={16} className="inline mr-1" />
                                            Time per Question (seconds)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.timePerQuestion}
                                            onChange={(e) => setFormData({ ...formData, timePerQuestion: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                            min="0"
                                            step="5"
                                            placeholder="0 for no limit"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set to 0 for no per-question limit</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Questions Source */}
                        <div className="card-premium p-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Questions Source</h2>

                            <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setMode('generate')}
                                    className={`py-3 rounded-md font-semibold transition-all ${mode === 'generate' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <Wand2 size={18} className="inline mr-2" />
                                    AI Generate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('upload')}
                                    className={`py-3 rounded-md font-semibold transition-all ${mode === 'upload' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <Upload size={18} className="inline mr-2" />
                                    Upload File
                                </button>
                            </div>

                            {mode === 'upload' ? (
                                <div className="space-y-6">
                                    {/* Formatting Guide */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-blue-800 font-bold">
                                                <Info size={20} />
                                                PDF/TXT Formatting Guide
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const content = `EXAMPLE QUESTIONS FILE FOR ASSESSMENT PORTAL
=============================================

This file shows the correct format for uploading questions.
You can use PDF, TXT, or CSV files.


FORMAT RULES:
-------------
1. Start each question with a number (e.g., 1. or Q1:)
2. Use A. B. C. D. for options (one per line)
3. Mark the answer with "Ans:" at the end


SAMPLE QUESTIONS:
-----------------

1. What is React?
A. A JavaScript library for building user interfaces
B. A programming language
C. A database management system
D. An operating system
Ans: A

2. Which hook is used to manage state in a functional component?
A. useEffect
B. useState
C. useContext
D. useReducer
Ans: B

3. What does JSX stand for?
A. JavaScript XML
B. Java Syntax Extension
C. JSON XML
D. JavaScript Extension
Ans: A

4. Which of the following is NOT a valid React hook?
A. useState
B. useEffect
C. useClass
D. useCallback
Ans: C

5. What is the purpose of the useEffect hook?
A. To manage component state
B. To perform side effects in functional components
C. To create custom hooks
D. To handle form submissions
Ans: B

6. In React, what is a prop?
A. A way to store component state
B. Data passed from parent to child component
C. A method to update the DOM
D. A type of React component
Ans: B

7. What command creates a new React application?
A. npm init react-app
B. npx create-react-app
C. npm new react
D. react create-app
Ans: B

8. Which method is called when a component is first mounted?
A. componentWillUnmount
B. componentDidUpdate
C. componentDidMount
D. shouldComponentUpdate
Ans: C

9. What is the virtual DOM?
A. A direct copy of the real DOM
B. A lightweight representation of the real DOM
C. A server-side rendering technique
D. A database for storing DOM elements
Ans: B

10. How do you conditionally render in React?
A. Using if-else statements only
B. Using switch statements only
C. Using ternary operators or logical && operators
D. Conditional rendering is not possible
Ans: C
`;
                                                        const blob = new Blob([content], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = 'example-questions.txt';
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                                                >
                                                    <Download size={16} />
                                                    Download Example
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowGuide(!showGuide)}
                                                    className="text-blue-600 text-sm font-semibold hover:underline"
                                                >
                                                    {showGuide ? 'Hide Guide' : 'Show Guide'}
                                                </button>
                                            </div>
                                        </div>

                                        {showGuide && (
                                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-bold text-blue-900 border-b border-blue-200 pb-1">Structure per Question</h4>
                                                    <ul className="text-sm text-blue-700 space-y-2">
                                                        <li className="flex gap-2">
                                                            <CheckCircle2 size={14} className="mt-1 flex-shrink-0" />
                                                            <span><strong>Numbering:</strong> Start with <code>1. </code> or <code>Q1: </code></span>
                                                        </li>
                                                        <li className="flex gap-2">
                                                            <CheckCircle2 size={14} className="mt-1 flex-shrink-0" />
                                                            <span><strong>Options:</strong> Use <code>A. B. C. D. </code> (one per line)</span>
                                                        </li>
                                                        <li className="flex gap-2">
                                                            <CheckCircle2 size={14} className="mt-1 flex-shrink-0" />
                                                            <span><strong>Answer Key:</strong> Include <code>Ans: A </code> at the end</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div className="bg-white/50 rounded-xl p-4 border border-blue-200">
                                                    <h4 className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wider text-center">Correct Example</h4>
                                                    <pre className="text-[11px] leading-relaxed font-mono text-blue-800">
                                                        1. What is React?{'\n'}
                                                        A. A library{'\n'}
                                                        B. A framework{'\n'}
                                                        C. A language{'\n'}
                                                        D. A database{'\n'}
                                                        Ans: A
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept=".pdf,.csv,.txt"
                                            onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer block">
                                            <div className={`flex flex-col items-center gap-6 p-12 border-2 border-dashed rounded-2xl text-center transition-all ${formData.file ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                                                }`}>
                                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${formData.file ? 'bg-purple-100' : 'bg-gray-100'
                                                    }`}>
                                                    {formData.file ? <FileText className="text-purple-600" size={40} /> : <Upload className="text-gray-400" size={40} />}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                        {formData.file ? formData.file.name : 'Drop your file here or click to browse'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">PDF, CSV, or TXT files</p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Describe the questions you want to generate
                                    </label>
                                    <textarea
                                        value={formData.prompt}
                                        onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                        placeholder="e.g., Create 10 multiple choice questions about React Hooks for intermediate developers"
                                        className="w-full h-36 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none resize-none"
                                        required={mode === 'generate'}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Assign Candidates */}
                        <div className="card-premium p-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                <Users size={24} className="inline mr-2" />
                                Assign to Candidates
                            </h2>

                            {candidates.length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-400">No candidates available. Create candidate accounts first.</p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                    {candidates.map((candidate) => (
                                        <label
                                            key={candidate.id}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.selectedCandidates.includes(candidate.id)
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.selectedCandidates.includes(candidate.id)}
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
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/examiner/dashboard')}
                                className="flex-1 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.title || (mode === 'generate' && !formData.prompt) || (mode === 'upload' && !formData.file)}
                                className="flex-1 py-4 btn-gradient rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={24} />
                                        <span>Create Assessment</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Sparkles, FileText, Loader2, Wand2, ArrowLeft, Users, Calendar, Clock } from 'lucide-react';

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
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        prompt: '',
        file: null as File | null,
        selectedCandidates: [] as string[],
        scheduledFor: '',
        durationMinutes: 30,
        timePerQuestion: 0
    });

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

        setUser(parsedUser);
        fetchCandidates();
    }, [router]);

    const fetchCandidates = async () => {
        try {
            const res = await fetch('/api/examiner/candidates');
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
        formDataToSend.append('scheduledFor', formData.scheduledFor);
        formDataToSend.append('durationMinutes', formData.durationMinutes.toString());
        formDataToSend.append('timePerQuestion', formData.timePerQuestion.toString());

        if (mode === 'generate') {
            formDataToSend.append('prompt', formData.prompt);
        } else if (formData.file) {
            formDataToSend.append('file', formData.file);
        }

        try {
            const res = await fetch('/api/assessments/create', {
                method: 'POST',
                body: formDataToSend,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.details || 'Failed to create assessment');
            }

            router.push('/examiner/dashboard');
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
        <div className="min-h-screen relative overflow-hidden bg-gray-50">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <button
                            onClick={() => router.push('/examiner/dashboard')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-2"
                        >
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="card-premium p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Assessment Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                        placeholder="e.g., React Fundamentals Quiz"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full h-24 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none resize-none"
                                        placeholder="Brief description of the assessment..."
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Calendar size={16} className="inline mr-1" />
                                            Schedule For (Optional)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.scheduledFor}
                                            onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                        <p className="text-xs text-gray-500 mt-1">Set to 0 for no per-question limit</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Questions Source */}
                        <div className="card-premium p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Questions Source</h2>

                            <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-gray-100 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setMode('generate')}
                                    className={`py-3 rounded-md font-semibold transition-all ${mode === 'generate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                                        }`}
                                >
                                    <Wand2 size={18} className="inline mr-2" />
                                    AI Generate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('upload')}
                                    className={`py-3 rounded-md font-semibold transition-all ${mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                                        }`}
                                >
                                    <Upload size={18} className="inline mr-2" />
                                    Upload File
                                </button>
                            </div>

                            {mode === 'upload' ? (
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
                                                <p className="text-lg font-semibold text-gray-900 mb-2">
                                                    {formData.file ? formData.file.name : 'Drop your file here or click to browse'}
                                                </p>
                                                <p className="text-sm text-gray-500">PDF, CSV, or TXT files</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Describe the questions you want to generate
                                    </label>
                                    <textarea
                                        value={formData.prompt}
                                        onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                        placeholder="e.g., Create 10 multiple choice questions about React Hooks for intermediate developers"
                                        className="w-full h-36 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none resize-none"
                                        required={mode === 'generate'}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Assign Candidates */}
                        <div className="card-premium p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                <Users size={24} className="inline mr-2" />
                                Assign to Candidates
                            </h2>

                            {candidates.length === 0 ? (
                                <p className="text-gray-600">No candidates available. Create candidate accounts first.</p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                    {candidates.map((candidate) => (
                                        <label
                                            key={candidate.id}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.selectedCandidates.includes(candidate.id)
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.selectedCandidates.includes(candidate.id)}
                                                onChange={() => toggleCandidate(candidate.id)}
                                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">{candidate.name}</div>
                                                <div className="text-sm text-gray-500">{candidate.email}</div>
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
                                className="flex-1 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
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

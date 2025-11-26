import { useState, useEffect } from 'react';
import { Upload, Sparkles, FileText, Loader2, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Candidate {
    id: string;
    name: string;
    email: string;
}

export default function CreateAssessment() {
    const [mode, setMode] = useState<'upload' | 'generate'>('generate');
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const router = useRouter();

    // Load candidates for assignment
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const res = await fetch('/api/examiner/candidates');
                if (res.ok) {
                    const data = await res.json();
                    setCandidates(data.candidates || []);
                }
            } catch (e) {
                console.error('Failed to load candidates', e);
            }
        };
        fetchCandidates();
    }, []);

    const toggleCandidate = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        if (mode === 'generate') {
            formData.append('prompt', prompt);
        } else if (file) {
            formData.append('file', file);
        }
        // Add assigned candidates (JSON string)
        formData.append('assignedTo', JSON.stringify(selectedIds));

        try {
            const res = await fetch('/api/assessments/create', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Failed to create assessment');
            const data = await res.json();
            router.push(`/assessment/${data.assessment_id}`);
        } catch (error) {
            console.error(error);
            alert('Error creating assessment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="gradient-border">
                <div className="card-premium p-8 md:p-10 relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Assessment</h2>
                        <p className="text-gray-600">Choose how you'd like to generate your questions</p>
                    </div>

                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-4 mb-8 p-2 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setMode('generate')}
                            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all ${mode === 'generate'
                                    ? 'bg-white text-gray-900 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Wand2 size={20} />
                            <span>AI Generate</span>
                        </button>
                        <button
                            onClick={() => setMode('upload')}
                            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all ${mode === 'upload'
                                    ? 'bg-white text-gray-900 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Upload size={20} />
                            <span>Upload File</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'upload' ? (
                            <div>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".pdf,.csv,.txt"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer block">
                                    <div
                                        className={`flex flex-col items-center gap-6 p-12 border-2 border-dashed rounded-2xl text-center transition-all ${file ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                                            }`}
                                    >
                                        <div
                                            className={`w-20 h-20 rounded-2xl flex items-center justify-center ${file ? 'bg-purple-100' : 'bg-gray-100'
                                                }`}
                                        >
                                            {file ? <FileText className="text-purple-600" size={40} /> : <Upload className="text-gray-400" size={40} />}
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900 mb-2">
                                                {file ? file.name : 'Drop your file here or click to browse'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Supports PDF, CSV, and TXT files up to 10MB
                                            </p>
                                        </div>
                                        {file && (
                                            <div className="px-4 py-2 bg-green-100 border border-green-300 rounded-full text-green-700 text-sm font-medium">
                                                ✓ Ready to process
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        What would you like to assess?
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        placeholder="Example: Create 5 multiple choice questions about React Hooks for intermediate developers"
                                        className="w-full h-36 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none resize-none transition-all"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-3 font-medium">Quick templates:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            '5 MCQs about React Hooks, medium difficulty',
                                            '10 questions about Python basics, easy level',
                                            '7 MCQs about Kubernetes fundamentals, hard difficulty',
                                        ].map((template, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setPrompt(template)}
                                                className="px-4 py-2 text-sm bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg text-gray-700 hover:text-purple-700 transition-all font-medium"
                                            >
                                                {template.split(',')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Candidate assignment section */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Assign to Candidates</h3>
                            {candidates.length === 0 ? (
                                <p className="text-gray-600">No candidates available. Create candidates in Manage Users.</p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {candidates.map(c => (
                                        <label key={c.id} className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(c.id)}
                                                onChange={() => toggleCandidate(c.id)}
                                                className="form-checkbox h-4 w-4 text-purple-600 border-gray-300 rounded"
                                            />
                                            <span className="text-gray-800">{c.name} ({c.email})</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (mode === 'upload' && !file) || (mode === 'generate' && !prompt)}
                            className="w-full py-5 btn-gradient rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>Creating your assessment...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={24} />
                                    <span>{mode === 'upload' ? 'Extract Questions' : 'Generate Assessment'}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

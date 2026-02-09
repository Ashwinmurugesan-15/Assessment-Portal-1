'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LearningResource } from '@/types';
import LearningResourceCard from '@/components/LearningResourceCard';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function CandidateLearningPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [resources, setResources] = useState<LearningResource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'candidate') {
            router.push('/');
            return;
        }
        setCurrentUser(parsedUser);

        fetchResources();
    }, [router]);

    const fetchResources = async () => {
        try {
            const res = await fetch(getApiUrl('/learning'));
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setResources(data.resources || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-20">
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <img
                                    src="/logo.png"
                                    alt="GuhaTek Logo"
                                    className="h-14 w-auto object-contain dark:brightness-0 dark:invert"
                                />
                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">VinavalAI</h1>
                                        <span className="text-gray-400 dark:text-gray-600">•</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Learning Resources</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{currentUser?.name} • {currentUser?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/candidate/dashboard"
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft size={18} />
                                    Back to Dashboard
                                </Link>
                                <ThemeToggle />
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Learning Resources</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Access course materials and learning content to enhance your skills
                        </p>
                    </div>

                    {/* Resources List */}
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Loading resources...</p>
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="card-premium p-20 text-center">
                            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <BookOpen size={40} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Learning Resources Available</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                There are currently no learning resources available. Check back later for new content.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {resources.map((resource) => (
                                <LearningResourceCard
                                    key={resource.id}
                                    resource={resource}
                                    currentUserId={currentUser?.id}
                                    showActions={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

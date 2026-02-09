'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { getApiUrl } from '@/lib/api-utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LearningResource } from '@/types';
import LearningResourceCard from '@/components/LearningResourceCard';
import LearningResourceForm from '@/components/LearningResourceForm';
import AnalyticsModal from '@/components/AnalyticsModal';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function AdminLearningPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [resources, setResources] = useState<LearningResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingResource, setEditingResource] = useState<LearningResource | null>(null);
    const [saving, setSaving] = useState(false);

    // Delete State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);

    // Analytics Modal State
    const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<{ id: string; title: string } | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<{ id: string; title: string } | null>(null);

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

    const handleSave = async (data: { title: string; description: string; course_url: string }) => {
        if (!currentUser) return;

        setSaving(true);
        try {
            if (editingResource) {
                // Update existing resource
                const res = await fetch(getApiUrl(`/learning/${editingResource.id}`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, user_role: currentUser.role })
                });

                if (!res.ok) throw new Error('Failed to update');
            } else {
                // Create new resource
                const res = await fetch(getApiUrl('/learning'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, created_by: currentUser.id, user_role: currentUser.role })
                });

                if (!res.ok) throw new Error('Failed to create');
            }

            await fetchResources();
            setShowForm(false);
            setEditingResource(null);
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: string, title: string) => {
        setDeleteConfirmation({ id, title });
    };

    const handleViewAnalytics = (resource: LearningResource) => {
        setSelectedResource({ id: resource.id, title: resource.title });
        setAnalyticsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentUser || !deleteConfirmation) return;

        try {
            const res = await fetch(getApiUrl(`/learning/${deleteConfirmation.id}?user_role=${currentUser.role}`), {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete');

            await fetchResources();
            setDeleteConfirmation(null);
        } catch (error: any) {
            console.error('Delete error:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleEdit = (resource: LearningResource) => {
        setEditingResource(resource);
        setShowForm(true);
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
                                <NextImage
                                    src="/logo.png"
                                    alt="GuhaTek Logo"
                                    width={120}
                                    height={40}
                                    className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
                                    priority
                                />
                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">VinavalAI</h1>
                                        <span className="text-gray-400 dark:text-gray-600">•</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Learning Resources</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back, {currentUser?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin"
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
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Learning Resources</h2>
                            <p className="text-gray-600 dark:text-gray-400">Manage course materials and learning content for candidates</p>
                        </div>
                        {!showForm && (
                            <button
                                onClick={() => {
                                    setEditingResource(null);
                                    setShowForm(true);
                                }}
                                className="px-6 py-3 btn-gradient font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Add Resource
                            </button>
                        )}
                    </div>

                    {/* Form */}
                    {showForm && (
                        <div className="card-premium p-8 mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                {editingResource ? 'Edit Learning Resource' : 'Create New Learning Resource'}
                            </h3>
                            <LearningResourceForm
                                resource={editingResource || undefined}
                                onSave={handleSave}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditingResource(null);
                                }}
                                loading={saving}
                            />
                        </div>
                    )}

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
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Learning Resources Yet</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                Start by adding your first learning resource to help candidates learn and improve their skills.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {resources.map((resource) => (
                                <LearningResourceCard
                                    key={resource.id}
                                    resource={resource}
                                    currentUserId={currentUser?.id}
                                    showActions={true}
                                    onEdit={() => handleEdit(resource)}
                                    onDelete={() => handleDeleteClick(resource.id, resource.title)}
                                    onViewAnalytics={() => handleViewAnalytics(resource)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Analytics Modal */}
                {selectedResource && (
                    <AnalyticsModal
                        isOpen={analyticsModalOpen}
                        onClose={() => {
                            setAnalyticsModalOpen(false);
                            setSelectedResource(null);
                        }}
                        resourceId={selectedResource.id}
                        resourceTitle={selectedResource.title}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                    <LogOut size={24} className="text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Resource?</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Are you sure you want to delete "{deleteConfirmation.title}"? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setDeleteConfirmation(null)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    Delete Resource
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

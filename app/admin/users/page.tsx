'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Users, Mail, Trash2, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'candidate' | 'examiner';
    created_at: string;
}

export default function ManageUsersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'examiner' as 'candidate' | 'examiner'
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

        setCurrentUser(parsedUser);
        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create user');
            }

            // Reset form and close modal
            setFormData({ name: '', email: '', password: '', role: 'examiner' });
            setShowCreateModal(false);

            // Refresh users list
            fetchUsers();

            alert('User created successfully!');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!currentUser) return;

        const confirmDelete = confirm(
            `Are you sure you want to delete "${userName}"?\n\nThis will:\n- Remove the user from the system\n- Remove them from all assessments\n- This action cannot be undone`
        );

        if (!confirmDelete) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    admin_id: currentUser.id
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            const data = await res.json();
            alert(data.message);

            // Refresh users list
            fetchUsers();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    const candidates = users.filter(u => u.role === 'candidate');
    const examiners = users.filter(u => u.role === 'examiner');

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <Link
                            href="/examiner/dashboard"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-2"
                        >
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </Link>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                                <p className="text-gray-600 text-sm">Manage candidates and examiners</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 btn-gradient font-semibold rounded-xl shadow-lg flex items-center gap-2"
                            >
                                <UserPlus size={20} />
                                Create User
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Stats */}
                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Users className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900">{candidates.length}</div>
                                    <div className="text-sm text-gray-600">Total Candidates</div>
                                </div>
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Shield className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-gray-900">{examiners.length}</div>
                                    <div className="text-sm text-gray-600">Total Examiners</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Examiners List */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Examiners</h2>
                        <div className="card-premium overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {examiners.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-900 font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 text-gray-600">{formatDate(user.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                                    Examiner
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Candidates List */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Candidates</h2>
                        <div className="card-premium overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {candidates.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-900 font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 text-gray-600">{formatDate(user.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                                    Candidate
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="card-premium p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h2>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Role
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'candidate' })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'candidate'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <Users className={`mx-auto mb-2 ${formData.role === 'candidate' ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                                        <div className="font-semibold text-sm">Candidate</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'examiner' })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'examiner'
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <Shield className={`mx-auto mb-2 ${formData.role === 'examiner' ? 'text-purple-600' : 'text-gray-400'}`} size={24} />
                                        <div className="font-semibold text-sm">Examiner</div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 btn-gradient font-semibold rounded-xl"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, LogIn, UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [role, setRole] = useState<'candidate' | 'examiner'>('candidate');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Store user session
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'candidate') {
                router.push('/candidate/dashboard');
            } else {
                router.push('/examiner/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 pattern-grid opacity-40" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20 animate-float-slow" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20 animate-float-slow" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-black text-gray-900">Assessment Portal</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-600">
                        {mode === 'login' ? 'Sign in to continue' : 'Get started with your account'}
                    </p>
                </div>

                {/* Login/Signup Card */}
                <div className="gradient-border">
                    <div className="card-premium p-8 relative z-10">
                        {/* Mode Toggle */}
                        <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => setMode('login')}
                                className={`py-2.5 rounded-md font-semibold transition-all ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                                    }`}
                            >
                                <LogIn size={18} className="inline mr-2" />
                                Login
                            </button>
                            <button
                                onClick={() => setMode('signup')}
                                className={`py-2.5 rounded-md font-semibold transition-all ${mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                                    }`}
                            >
                                <UserPlus size={18} className="inline mr-2" />
                                Sign Up
                            </button>
                        </div>

                        {/* Role Selection */}
                        {mode === 'signup' && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    I am a:
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole('candidate')}
                                        className={`p-4 rounded-xl border-2 transition-all ${role === 'candidate'
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <UserIcon className={`mx-auto mb-2 ${role === 'candidate' ? 'text-purple-600' : 'text-gray-400'}`} size={24} />
                                            <div className="font-semibold text-gray-900">Candidate</div>
                                            <div className="text-xs text-gray-500">Take assessments</div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('examiner')}
                                        className={`p-4 rounded-xl border-2 transition-all ${role === 'examiner'
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <Sparkles className={`mx-auto mb-2 ${role === 'examiner' ? 'text-purple-600' : 'text-gray-400'}`} size={24} />
                                            <div className="font-semibold text-gray-900">Examiner</div>
                                            <div className="text-xs text-gray-500">Create assessments</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 btn-gradient rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                            >
                                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        {mode === 'signup' && role === 'examiner' && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                                <strong>Note:</strong> Examiner accounts must be approved by an administrator.
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { AdminAnalytics } from '@/types';
import { BarChart3, Users, Clock, TrendingUp, Home, Activity, Award } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState<AdminAnalytics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/admin/analytics');
                if (!res.ok) throw new Error('Failed to load');
                const data = await res.json();
                setAnalytics(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Activity className="text-white" size={24} />
                                    </div>
                                    Admin Dashboard
                                </h1>
                                <p className="text-gray-600">Comprehensive analytics and performance insights</p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/examiner/dashboard"
                                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    ← Back
                                </Link>
                                <Link
                                    href="/"
                                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Home size={18} />
                                    Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mb-4" />
                            <p className="text-gray-600 text-lg font-medium">Loading analytics...</p>
                        </div>
                    ) : analytics.length === 0 ? (
                        <div className="card-premium p-20 text-center">
                            <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <BarChart3 size={40} className="text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Data Yet</h3>
                            <p className="text-gray-600 mb-6">Create and complete assessments to see analytics here</p>
                            <Link href="/" className="inline-flex px-6 py-3 btn-gradient font-semibold rounded-xl">
                                Create Assessment
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {analytics.map((item, index) => (
                                <div
                                    key={item.assessment_id}
                                    className="gradient-border"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="card-premium p-8 relative z-10">
                                        {/* Header */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                                        <Award className="text-white" size={20} />
                                                    </div>
                                                    <h2 className="text-xl font-bold text-gray-900">
                                                        Assessment #{item.assessment_id.slice(0, 8)}
                                                    </h2>
                                                </div>
                                                <p className="text-sm text-gray-600 ml-13">
                                                    {item.admin_analytics.total_attempts} attempts • {item.admin_analytics.unique_users_attempted} unique participants
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="px-4 py-2 bg-purple-100 border border-purple-300 rounded-lg">
                                                    <span className="text-purple-700 font-bold text-sm">
                                                        {item.admin_analytics.total_attempts} Attempts
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                            <div className="stat-card card-premium p-6 hover:shadow-lg transition-shadow">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                                        <TrendingUp className="text-green-600" size={20} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600">Avg Score</span>
                                                </div>
                                                <div className="text-4xl font-black text-gray-900 mb-1">
                                                    {Math.round(item.admin_analytics.score_distribution.mean)}%
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Range: {Math.round(item.admin_analytics.score_distribution.min)}% - {Math.round(item.admin_analytics.score_distribution.max)}%
                                                </div>
                                            </div>

                                            <div className="stat-card card-premium p-6 hover:shadow-lg transition-shadow">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                        <Clock className="text-blue-600" size={20} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600">Avg Time</span>
                                                </div>
                                                <div className="text-4xl font-black text-gray-900 mb-1">
                                                    {Math.round(item.admin_analytics.avg_total_time_seconds)}s
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ~{Math.round(item.admin_analytics.avg_time_per_question_seconds)}s per question
                                                </div>
                                            </div>

                                            <div className="stat-card card-premium p-6 hover:shadow-lg transition-shadow">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                                        <BarChart3 className="text-purple-600" size={20} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600">Median</span>
                                                </div>
                                                <div className="text-4xl font-black text-gray-900 mb-1">
                                                    {Math.round(item.admin_analytics.score_distribution.median)}%
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Middle value
                                                </div>
                                            </div>

                                            <div className="stat-card card-premium p-6 hover:shadow-lg transition-shadow">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                                        <Users className="text-orange-600" size={20} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600">Users</span>
                                                </div>
                                                <div className="text-4xl font-black text-gray-900 mb-1">
                                                    {item.admin_analytics.unique_users_attempted}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Unique participants
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score Distribution Chart */}
                                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                            <h3 className="text-sm font-bold text-gray-700 mb-4">Score Distribution</h3>
                                            <div className="flex items-end gap-4 h-40">
                                                {[
                                                    { label: 'Min', value: item.admin_analytics.score_distribution.min, color: 'from-red-400 to-red-500' },
                                                    { label: 'Avg', value: item.admin_analytics.score_distribution.mean, color: 'from-yellow-400 to-yellow-500' },
                                                    { label: 'Median', value: item.admin_analytics.score_distribution.median, color: 'from-purple-400 to-purple-500' },
                                                    { label: 'Max', value: item.admin_analytics.score_distribution.max, color: 'from-green-400 to-green-500' }
                                                ].map((stat, idx) => (
                                                    <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                                                        <div
                                                            className={`w-full bg-gradient-to-t ${stat.color} rounded-t-xl transition-all shadow-lg`}
                                                            style={{ height: `${(stat.value / 100) * 100}%` }}
                                                        />
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-gray-900">{Math.round(stat.value)}%</div>
                                                            <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

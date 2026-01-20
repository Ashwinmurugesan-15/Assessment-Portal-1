'use client';

import Link from 'next/link';
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-6">
            <div className="max-w-lg w-full text-center">
                {/* 404 Animation */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-violet-200 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200/50">
                            <span className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                404
                            </span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                            <FileQuestion className="text-white" size={24} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                    Page Not Found
                </h1>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-md mx-auto">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved to a new location.
                </p>

                {/* Suggestions */}
                <div className="mb-10 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                        <Search size={18} className="text-indigo-600" />
                        Here&apos;s what you can do:
                    </h2>
                    <ul className="text-left text-gray-600 space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            Check if the URL is typed correctly
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            Go back to the homepage and navigate from there
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            Contact support if you believe this is an error
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 transform hover:-translate-y-0.5"
                    >
                        <Home size={20} />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => typeof window !== 'undefined' && window.history.back()}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={20} />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home, Mail } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console in development, could be sent to error tracking service in production
        if (process.env.NODE_ENV !== 'production') {
            console.error('Application Error:', error);
        }
        // In production, you could send to an error tracking service like Sentry
        // reportError(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-6">
            <div className="max-w-lg w-full">
                {/* Error Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center shadow-xl shadow-red-100/50 animate-pulse">
                            <AlertTriangle className="text-red-600" size={48} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                            !
                        </div>
                    </div>
                </div>

                {/* Error Content */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        Oops! Something went wrong
                    </h1>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        We encountered an unexpected error while processing your request.
                        Our team has been notified and is working on a fix.
                    </p>
                </div>

                {/* Error Details (only in development) */}
                {process.env.NODE_ENV !== 'production' && error.message && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-mono text-red-700 break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-red-500 mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 transform hover:-translate-y-0.5"
                    >
                        <RefreshCcw size={20} />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                    >
                        <Home size={20} />
                        Go Home
                    </Link>
                </div>

                {/* Support Link */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Need help?{' '}
                        <a
                            href="mailto:support@assessmentportal.com"
                            className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                        >
                            <Mail size={14} />
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

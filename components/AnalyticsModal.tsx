
import { useEffect, useState } from 'react';
import { X, User, Calendar, Clock } from 'lucide-react';
import { getApiUrl } from '@/lib/api-utils';

interface Viewer {
    name: string;
    viewed_at: string;
}

interface AnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceTitle: string;
    resourceId: string;
}

export default function AnalyticsModal({ isOpen, onClose, resourceTitle, resourceId }: AnalyticsModalProps) {
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && resourceId) {
            fetchViewers();
        }
    }, [isOpen, resourceId]);

    const fetchViewers = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl(`/learning/${resourceId}/analytics`));
            if (res.ok) {
                const data = await res.json();
                setViewers(data.viewers || []);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resource Analytics</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{resourceTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <User size={20} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Viewers</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{viewers.length}</p>
                            </div>
                        </div>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
                        Viewer History
                    </h4>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : viewers.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <Clock size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No views recorded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {viewers.map((viewer, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold">
                                            {viewer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{viewer.name}</p>
                                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Viewed
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {new Date(viewer.viewed_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(viewer.viewed_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

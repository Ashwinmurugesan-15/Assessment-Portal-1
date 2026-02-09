'use client';

import { useState } from 'react';
import { Edit, Trash2, ExternalLink, Calendar, User, Play, BarChart2 } from 'lucide-react';
import { LearningResource } from '@/types';
import { getApiUrl } from '@/lib/api-utils';

interface LearningResourceCardProps {
    resource: LearningResource;
    currentUserId?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onViewAnalytics?: () => void;
    showActions?: boolean;
}

// Helper function to extract YouTube video ID
function getYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

export default function LearningResourceCard({
    resource,
    currentUserId,
    onEdit,
    onDelete,
    onViewAnalytics,
    showActions = false
}: LearningResourceCardProps) {
    const videoId = getYouTubeVideoId(resource.course_url);
    const isYouTube = resource.url_type === 'youtube' && videoId;
    const [isPlaying, setIsPlaying] = useState(false);
    const [imgError, setImgError] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const recordView = async () => {
        if (!currentUserId) return;
        try {
            await fetch(getApiUrl('/learning/progress'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resourceId: resource.id,
                    userId: currentUserId
                })
            });
        } catch (error) {
            console.error('Failed to record view:', error);
        }
    };

    const handlePlay = () => {
        setIsPlaying(true);
        recordView();
    };

    const handleLinkClick = () => {
        recordView();
    };

    return (
        <div className="card-premium p-6 hover:shadow-lg transition-all">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{resource.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{resource.description}</p>
                </div>
                {showActions && (
                    <div className="flex gap-2 ml-4">
                        {onViewAnalytics && (
                            <button
                                onClick={onViewAnalytics}
                                className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all shadow-sm"
                                title="View Analytics"
                            >
                                <BarChart2 size={18} />
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all shadow-sm"
                                title="Edit Resource"
                            >
                                <Edit size={18} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-all shadow-sm"
                                title="Delete Resource"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Watch on YouTube Button (Always visible for YouTube to ensure accessibility) */}
            {isYouTube && (
                <div className="mb-4">
                    <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={recordView}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-bold border-2 border-red-100 dark:border-red-900/30"
                    >
                        <ExternalLink size={18} />
                        Watch on YouTube
                    </a>
                </div>
            )}

            {/* Video or Link */}
            {isYouTube ? (
                <div className="mb-4 rounded-xl overflow-hidden shadow-md aspect-video relative group bg-black">
                    {!isPlaying ? (
                        <div
                            className="absolute inset-0 cursor-pointer group"
                            onClick={handlePlay}
                        >
                            <img
                                src={imgError
                                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                                    : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                                }
                                onError={() => setImgError(true)}
                                alt={resource.title}
                                className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                    <Play size={32} className="text-white ml-1" fill="white" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full overflow-hidden">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                title={resource.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            ></iframe>
                        </div>
                    )}
                </div>
            ) : resource.image_url ? (
                <div className="mb-4 rounded-xl overflow-hidden shadow-md aspect-video relative group">
                    <img
                        src={resource.image_url}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                            href={resource.course_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleLinkClick}
                            className="px-6 py-3 bg-white text-purple-700 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <ExternalLink size={18} />
                            Open Link
                        </a>
                    </div>
                </div>
            ) : (
                <a
                    href={resource.course_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all font-medium mb-4"
                >
                    <ExternalLink size={18} />
                    Open Course Link
                </a>
            )}

            {/* Footer Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(resource.created_at)}
                </span>
                {resource.updated_at !== resource.created_at && (
                    <span className="flex items-center gap-1">
                        Updated {formatDate(resource.updated_at)}
                    </span>
                )}
            </div>
        </div>
    );
}

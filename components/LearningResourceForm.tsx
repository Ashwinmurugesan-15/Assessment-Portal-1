'use client';

import { useState, useEffect } from 'react';
import { Save, X, ExternalLink, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';

interface LearningResourceFormProps {
    resource?: {
        id: string;
        title: string;
        description: string;
        course_url: string;
        url_type: 'youtube' | 'generic';
        image_url?: string;
    };
    onSave: (data: { title: string; description: string; course_url: string; image_url?: string }) => void;
    onCancel: () => void;
    loading?: boolean;
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

export default function LearningResourceForm({ resource, onSave, onCancel, loading = false }: LearningResourceFormProps) {
    const [title, setTitle] = useState(resource?.title || '');
    const [description, setDescription] = useState(resource?.description || '');
    const [courseUrl, setCourseUrl] = useState(resource?.course_url || '');
    const [imageUrl, setImageUrl] = useState(resource?.image_url || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isYouTube, setIsYouTube] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        setIsYouTube(!!getYouTubeVideoId(courseUrl));
    }, [courseUrl]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            // Create preview URL
            setImageUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (title && description && courseUrl) {
            let finalImageUrl = imageUrl;

            // Upload image if selected
            if (imageFile) {
                setUploading(true);
                try {
                    const formData = new FormData();
                    formData.append('file', imageFile);

                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (res.ok) {
                        const data = await res.json();
                        finalImageUrl = data.url;
                    } else {
                        console.error('Failed to upload image');
                        alert('Failed to upload image. Please try again.');
                        setUploading(false);
                        return;
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Error uploading image');
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            onSave({
                title,
                description,
                course_url: courseUrl,
                image_url: finalImageUrl
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Course Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all"
                    placeholder="e.g., React Fundamentals"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all resize-none"
                    placeholder="Describe what this course covers, key topics, and learning outcomes..."
                    required
                />
            </div>

            <div>
                <label htmlFor="courseUrl" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Course URL <span className="text-red-500">*</span>
                </label>
                <input
                    type="url"
                    id="courseUrl"
                    value={courseUrl}
                    onChange={(e) => setCourseUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all"
                    placeholder="https://www.youtube.com/watch?v=... or any course URL"
                    required
                />
                {isYouTube && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <ExternalLink size={16} />
                        YouTube video detected - will be embedded
                    </p>
                )}
                {courseUrl && !isYouTube && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <ExternalLink size={16} />
                        Will be displayed as a clickable link
                    </p>
                )}
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={loading || uploading || !title || !description || !courseUrl}
                    className="flex-1 px-6 py-3 btn-gradient font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            {loading ? 'Saving...' : resource ? 'Update Resource' : 'Create Resource'}
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading || uploading}
                    className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    <X size={20} />
                    Cancel
                </button>
            </div>
        </form>
    );
}

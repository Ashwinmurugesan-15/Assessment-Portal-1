export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="text-center">
                {/* Animated Logo/Loader */}
                <div className="relative mb-8">
                    {/* Outer ring */}
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-100 animate-pulse"></div>

                    {/* Spinning ring */}
                    <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>

                    {/* Inner dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full animate-pulse"></div>
                    </div>
                </div>

                {/* Loading Text */}
                <h2 className="text-xl font-bold text-gray-800 mb-2">Loading...</h2>
                <p className="text-gray-500 text-sm">Please wait while we prepare your content</p>

                {/* Animated dots */}
                <div className="mt-6 flex justify-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
}

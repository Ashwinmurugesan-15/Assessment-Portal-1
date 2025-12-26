import config from './config';

/**
 * Utility to get the full API URL
 * @param path The API path (e.g., '/auth/login')
 * @returns The full URL
 */
export function getApiUrl(path: string): string {
    const baseUrl = config.api.baseUrl;
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // If baseUrl is relative (starts with /), just return the path
    if (baseUrl.startsWith('/')) {
        return normalizedPath.startsWith(baseUrl) ? normalizedPath : `${baseUrl}${normalizedPath}`;
    }

    // If baseUrl is absolute, combine them
    return `${baseUrl.replace(/\/$/, '')}${normalizedPath}`;
}

/**
 * Common fetch wrapper with base URL and default headers
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
    const url = getApiUrl(path);

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    return response;
}

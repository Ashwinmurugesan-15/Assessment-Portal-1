/**
 * Rate Limiter Middleware for API Routes
 * Provides protection against abuse and DDoS attacks
 */

import { NextResponse } from 'next/server';
import { config } from './config';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In production, use Redis or similar distributed cache
// This is an in-memory implementation suitable for single-instance deployments
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Every minute

export interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    message?: string;
    keyGenerator?: (request: Request) => string;
}

export function getClientIP(request: Request): string {
    // Check common headers for real IP behind proxies
    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }

    const xRealIP = request.headers.get('x-real-ip');
    if (xRealIP) {
        return xRealIP;
    }

    // Fallback - in production behind a reverse proxy, this might not be accurate
    return 'unknown';
}

export function rateLimit(options: RateLimitOptions = {}) {
    const {
        windowMs = config.security.rateLimitWindow,
        max = config.security.rateLimitMax,
        message = 'Too many requests, please try again later.',
        keyGenerator = getClientIP,
    } = options;

    return {
        check(request: Request): { success: boolean; remaining: number; resetTime: number } {
            const key = keyGenerator(request);
            const now = Date.now();

            let entry = rateLimitStore.get(key);

            if (!entry || entry.resetTime < now) {
                entry = {
                    count: 0,
                    resetTime: now + windowMs,
                };
            }

            entry.count++;
            rateLimitStore.set(key, entry);

            const remaining = Math.max(0, max - entry.count);
            const resetTime = entry.resetTime;

            return {
                success: entry.count <= max,
                remaining,
                resetTime,
            };
        },

        getResponse(): NextResponse {
            return NextResponse.json(
                {
                    error: message,
                    retryAfter: Math.ceil(windowMs / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil(windowMs / 1000)),
                    }
                }
            );
        },

        getHeaders(result: { remaining: number; resetTime: number }): Headers {
            const headers = new Headers();
            headers.set('X-RateLimit-Limit', String(max));
            headers.set('X-RateLimit-Remaining', String(result.remaining));
            headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));
            return headers;
        }
    };
}

// Pre-configured rate limiters for different endpoints
export const apiRateLimiter = rateLimit();

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

export const assessmentRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute for assessments
});

export default rateLimit;

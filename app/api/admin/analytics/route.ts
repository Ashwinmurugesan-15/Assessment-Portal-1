import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AdminAnalytics } from '@/types';

export async function GET() {
    try {
        const allResults = db.getAllResults();

        // Group by assessment
        const assessmentGroups: Record<string, typeof allResults> = {};
        allResults.forEach(r => {
            if (!assessmentGroups[r.assessment_id]) {
                assessmentGroups[r.assessment_id] = [];
            }
            assessmentGroups[r.assessment_id].push(r);
        });

        const analytics: AdminAnalytics[] = Object.entries(assessmentGroups).map(([id, results]) => {
            const scores = results.map(r => r.result.score);
            const times = results.map(r => r.result.analytics.time_taken_seconds);
            const avgTimesPerQ = results.map(r => r.result.analytics.avg_time_per_question_seconds);

            const totalAttempts = results.length;
            const uniqueUsers = new Set(results.map(r => r.user_id)).size;

            const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
            const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;

            scores.sort((a, b) => a - b);

            return {
                assessment_id: id,
                admin_analytics: {
                    total_attempts: totalAttempts,
                    unique_users_attempted: uniqueUsers,
                    avg_time_per_question_seconds: avg(avgTimesPerQ),
                    avg_total_time_seconds: avg(times),
                    score_distribution: {
                        min: scores[0] || 0,
                        max: scores[scores.length - 1] || 0,
                        mean: avg(scores),
                        median: scores[Math.floor(scores.length / 2)] || 0
                    }
                }
            };
        });

        return NextResponse.json(analytics);

    } catch (error) {
        console.error('Admin Analytics Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

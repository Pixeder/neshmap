// src/app/analytics/[documentId]/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

export default function AnalyticsDashboardPage() {
  const { documentId } = useParams() as { documentId: string };
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const studentId = localStorage.getItem('activeStudentId');

    if (!studentId || !documentId) {
      setError('Missing student or document session details. Please re-upload your textbook.');
      setLoading(false);
      return;
    }

    apiClient
      .get(`/analytics/dashboard?studentId=${studentId}&documentId=${documentId}`)
      .then((res: any) => {
        setAnalytics(res.data || res);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load dashboard metrics:', err);
        setError(err.message || 'Failed to retrieve analytics data from server.');
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm max-w-md text-center">
          {error}
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold"
        >
          Return to Onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight">Student Mastery Analytics</h1>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Overall Mastery</span>
            <div className="text-3xl font-bold text-blue-400">
              {Math.round((analytics?.overallMasteryScore || 0) * 100)}%
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Course Completion</span>
            <div className="text-3xl font-bold text-emerald-400">
              {analytics?.courseCompletionPercentage || 0}%
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Completed Topics</span>
            <div className="text-3xl font-bold text-slate-200">
              {analytics?.completedTopicsCount || 0} / {analytics?.totalTopics || 0}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Topics Needing Review</span>
            <div className="text-3xl font-bold text-amber-400">
              {analytics?.needsReviewTopicsCount || 0}
            </div>
          </div>
        </div>

        {/* Weakness Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Weakness Analysis</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analytics?.weaknessRadar?.length > 0 ? (
              analytics.weaknessRadar.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">{item.weakness}</span>
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-md font-semibold">
                    {item.occurrences} flags
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic">No active knowledge gaps flagged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
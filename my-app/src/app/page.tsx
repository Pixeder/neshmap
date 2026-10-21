// src/app/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, BookOpen, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

export default function OnboardingPage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUploadAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !studentName || !email) {
      setErrorMessage('Please complete all fields and select a PDF textbook.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Register or retrieve student profile
      const studentRes: any = await apiClient.post('/student/', {
        name: studentName,
        email: email,
        learningPreferences: { pace: 'MODERATE', preferredDifficulty: 'INTERMEDIATE' },
      });

      const studentId = studentRes.data?._id || '67b0a1f2c9e8a71234567890'; // Fallback demo ID

      // 2. Upload PDF document for ingestion and vector indexing
      const formData = new FormData();
      formData.append('document', file);
      formData.append('studentId', studentId);

      const uploadRes: any = await apiClient.post('/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const documentId = uploadRes.data?.documentId || `doc_${Date.now()}`;

      // Save studentId locally and navigate to interactive workspace
      localStorage.setItem('activeStudentId', studentId);
      router.push(`/workspace/${documentId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process document upload.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/20 text-blue-400 rounded-xl mb-2">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Adaptive Learning Platform</h1>
          <p className="text-slate-400 text-sm">
            Upload your PDF textbook to build an agentic curriculum, vector index, and Socratic workspace.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleUploadAndRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Student Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Study Material (PDF Textbook)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-900/50">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer space-y-2 block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                {file ? (
                  <div className="flex items-center justify-center text-blue-400 gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">
                    Drag and drop your PDF here, or <span className="text-blue-400 font-semibold">browse file</span>
                  </p>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Ingesting PDF & Building Roadmap...</span>
              </>
            ) : (
              <span>Start Learning Session</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
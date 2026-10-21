// src/app/workspace/[documentId]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  Send,
  Sparkles,
  BarChart2,
  FileText,
  List,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useAgentStream } from '../../../hooks/useAgentStream';
import ReactMarkdown from 'react-markdown';

export default function WorkspacePage() {
  const { documentId } = useParams() as { documentId: string };
  const router = useRouter();

  const [studentId, setStudentId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'ROADMAP'>('CHAT');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ sender: 'USER' | 'AGENT'; text: string; tool?: string }>>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const { isStreaming, content: streamedContent, streamQuery } = useAgentStream();

  useEffect(() => {
    const savedStudentId = localStorage.getItem('activeStudentId') || '67b0a1f2c9e8a71234567890';
    setStudentId(savedStudentId);

    // Fetch Curriculum Roadmap
    apiClient
      .get(`/roadmap/${documentId}`)
      .then((res: any) => setRoadmap(res.data))
      .catch((err) => console.error('Failed to load roadmap:', err));
  }, [documentId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const query = inputQuery;
    setInputQuery('');
    setSecurityWarning(null);

    setMessages((prev) => [...prev, { sender: 'USER', text: query }]);

    try {
      // Use Central Tool Orchestrator Gateway
      const res: any = await apiClient.post('/interact', {
        studentId,
        documentId,
        query,
      });

      const responseText = res.data?.result?.response || res.data?.result?.answer || 'Response generated.';
      const executedTool = res.data?.executedTool;

      setMessages((prev) => [
        ...prev,
        { sender: 'AGENT', text: responseText, tool: executedTool },
      ]);
    } catch (err: any) {
      if (err.type === 'OFF_TOPIC_GUARDRAIL') {
        setSecurityWarning('Request blocked: Query is off-topic or outside the scope of your educational material.');
      } else if (err.type === 'SECURITY_INJECTION') {
        setSecurityWarning('Security Violation: Disallowed pattern or prompt injection detected.');
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'AGENT', text: 'An error occurred while generating a response.' },
        ]);
      }
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-lg">Adaptive Learning Workspace</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md border border-slate-700">
            Doc ID: {documentId}
          </span>
        </div>

        <button
          onClick={() => router.push(`/analytics/${documentId}`)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          <span>Analytics Dashboard</span>
        </button>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: PDF Document Viewer */}
        <div className="w-1/2 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center p-6 text-slate-500">
          <FileText className="w-16 h-16 mb-4 text-slate-700" />
          <p className="font-semibold text-slate-400">PDF Document View</p>
          <p className="text-xs text-slate-600 mt-1">
            Standard PDF Renderer bound to active vector chunks.
          </p>
        </div>

        {/* Right Pane: Agentic Chat & Roadmap Workspace */}
        <div className="w-1/2 flex flex-col bg-slate-900">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950 px-4">
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'CHAT'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Socratic Agent</span>
            </button>
            <button
              onClick={() => setActiveTab('ROADMAP')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'ROADMAP'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Course Syllabus</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'CHAT' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Security Guardrail Banner */}
              {securityWarning && (
                <div className="m-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{securityWarning}</span>
                </div>
              )}

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <Sparkles className="w-10 h-10 mx-auto text-slate-700" />
                    <p className="text-sm">Ask any question or request a topic explanation.</p>
                  </div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      msg.sender === 'USER' ? 'items-end' : 'items-start'
                    }`}
                  >
                    {msg.tool && (
                      <span className="text-[10px] text-blue-400 font-mono mb-1 flex items-center gap-1">
                        {msg.tool === 'web_search_tool' ? <Globe className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        Executed: {msg.tool}
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-sm ${
                        msg.sender === 'USER'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[85%] p-3.5 rounded-2xl text-sm bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none">
                      <ReactMarkdown>{streamedContent}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask a question or request a study topic..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Roadmap Tree View */
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {roadmap?.modules?.map((mod: any, mIdx: number) => (
                <div key={mIdx} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                      {mIdx + 1}
                    </span>
                    {mod.moduleTitle}
                  </h3>
                  <div className="space-y-2 pl-8">
                    {mod.topics?.map((topic: any, tIdx: number) => (
                      <div
                        key={tIdx}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-medium text-slate-200">{topic.title}</p>
                          <p className="text-[10px] text-slate-500">{topic.description}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {topic.estimatedMinutes} mins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
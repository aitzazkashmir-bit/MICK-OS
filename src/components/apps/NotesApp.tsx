import React, { useState } from 'react';
import { FileText, Sparkles, RefreshCw, Save, Check } from 'lucide-react';

export const NotesApp: React.FC = () => {
  const [content, setContent] = useState<string>(
    `# Mick AI Notes Pad 📝\n\n- Welcome to your AI-augmented markdown notes pad.\n- Click **AI Summarize** or **AI Expand** to generate instant insight using Gemini 3.6 Flash!`
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleAiSummarize = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Summarize the following notes into 3 concise key takeaways:\n\n${content}`,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setContent((prev) => `${prev}\n\n### AI Executive Summary:\n${data.text}`);
        setStatus('Summary added!');
        setTimeout(() => setStatus(null), 2500);
      }
    } catch (e: any) {
      setStatus('Error generating summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-xs text-slate-200">Notes & Thoughts</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAiSummarize}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI Summarize</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-4 bg-slate-950 flex flex-col">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your notes here..."
          className="w-full flex-1 bg-transparent text-slate-200 font-sans text-xs leading-relaxed focus:outline-none resize-none"
        />
      </div>

      {/* Status Bar */}
      {status && (
        <div className="px-4 py-1.5 bg-indigo-950 text-indigo-300 text-[11px] font-medium flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-indigo-400" />
          <span>{status}</span>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, Sparkles, ExternalLink } from 'lucide-react';

export const BrowserApp: React.FC = () => {
  const [url, setUrl] = useState('https://wikipedia.org');
  const [currentUrl, setCurrentUrl] = useState('https://wikipedia.org');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let target = url;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    setCurrentUrl(target);
    setUrl(target);
  };

  const handleAiWebAnalyze = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Give a brief informative overview of what the website "${currentUrl}" is, its main features, and purpose.`,
        }),
      });
      const data = await res.json();
      setAiSummary(data.text || 'No summary generated.');
    } catch (e: any) {
      setAiSummary('Failed to analyze web page.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Browser Navbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <button className="p-1 rounded hover:bg-slate-800 text-slate-400">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button className="p-1 rounded hover:bg-slate-800 text-slate-400">
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setCurrentUrl(url)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <form onSubmit={handleNavigate} className="flex-1 flex items-center">
          <div className="relative w-full">
            <Globe className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </form>

        <button
          onClick={handleAiWebAnalyze}
          disabled={loadingAi}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Web Insights</span>
        </button>
      </div>

      {/* Main Browser Canvas Frame */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
        {aiSummary && (
          <div className="absolute top-2 left-4 right-4 z-20 p-4 rounded-xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl text-slate-200 text-xs backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-bold text-indigo-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Gemini Web Summary: {currentUrl}
              </span>
              <button onClick={() => setAiSummary(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="leading-relaxed">{aiSummary}</p>
          </div>
        )}

        <iframe
          src={currentUrl}
          title="Mick Browser Sandbox"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
};

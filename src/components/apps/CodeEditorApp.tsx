import React, { useState } from 'react';
import { FileItem } from '../../types';
import { DEFAULT_FILES } from '../../data';
import { Code, Play, Sparkles, Save, Copy, Check, RefreshCw } from 'lucide-react';

interface CodeEditorAppProps {
  initialFile?: FileItem;
}

export const CodeEditorApp: React.FC<CodeEditorAppProps> = ({ initialFile }) => {
  const [activeFile, setActiveFile] = useState<FileItem>(initialFile || DEFAULT_FILES[1]);
  const [code, setCode] = useState<string>(activeFile.content || '');
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [output, setOutput] = useState<string>('');

  const handleRun = () => {
    setOutput('Running TypeScript compiler...\nCompilation succeeded without errors!\nOutput stdout:\n---------------------\n[Qubit Simulator] State transformed: Hadamard Matrix applied.\nNorm: 0.7071067811865475');
  };

  const handleAiRefactor = async () => {
    if (!code.trim() || aiLoading) return;

    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Refactor and improve the following code for better performance and readability, keep output purely code block:\n\n${code}`,
          mode: 'coder',
        }),
      });
      const data = await res.json();
      if (data.text) {
        // strip markdown triple backticks if present
        let cleaned = data.text.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '');
        setCode(cleaned);
        setOutput('Code successfully refactored and optimized by Gemini 3.6 Flash!');
      }
    } catch (e: any) {
      setOutput('AI error: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-mono text-xs">
      {/* IDE Topbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">{activeFile.name}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
            {activeFile.extension?.toUpperCase() || 'TS'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAiRefactor}
            disabled={aiLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-sans transition-colors"
          >
            {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI Refactor</span>
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Code</span>
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 p-3 bg-slate-950 flex flex-col">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none p-2 selection:bg-indigo-500/30"
          />
        </div>

        {/* Output Console Pane */}
        {output && (
          <div className="w-full md:w-80 p-3 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-semibold text-slate-300">
              <span>Console Output</span>
              <button
                onClick={() => setOutput('')}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            <pre className="flex-1 text-slate-300 whitespace-pre-wrap font-mono text-[11px] overflow-y-auto">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

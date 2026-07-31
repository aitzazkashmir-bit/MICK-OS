import React, { useState, useEffect } from 'react';
import {
  Search,
  Command,
  Bot,
  Zap,
  Folder,
  Settings,
  Sparkles,
  ArrowRight,
  Cpu,
  Mail,
  Calendar,
  Briefcase,
  FileText,
  Code,
  Globe,
  Terminal,
  Activity,
  X
} from 'lucide-react';
import { SYSTEM_APPS } from '../data';
import { AppId } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: AppId) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenApp }) => {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredApps = SYSTEM_APPS.filter(
    (app) =>
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleExecuteCommand = async () => {
    if (!query.trim() || isExecuting) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const res = await fetch('/api/engine/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: query }),
      });
      const data = await res.json();
      setExecutionResult(data.responseText || 'Command executed by MICK Orchestrator.');
    } catch (err: any) {
      setExecutionResult(`Execution error: ${err.message || 'Failed'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-950/70 backdrop-blur-md animate-fade-in p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans select-none">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/90">
          <Command className="w-5 h-5 text-indigo-400 mr-3 animate-pulse" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
            placeholder="Search OS apps, 19 Master Agents, commands, or type an instruction..."
            autoFocus
            className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder:text-slate-500 font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="ml-2 px-2 py-0.5 text-[10px] bg-slate-800 border border-slate-700 text-slate-400 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Dynamic Execution Result Output */}
        {executionResult && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs text-slate-200 space-y-1">
            <div className="text-[10px] font-mono text-emerald-400 font-bold flex justify-between">
              <span>MICK AI Orchestrator Execution Output</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="leading-relaxed whitespace-pre-wrap">{executionResult}</div>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {query.trim() && (
            <div
              onClick={handleExecuteCommand}
              className="p-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl cursor-pointer flex items-center justify-between text-xs transition"
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="font-bold text-white">Execute via MICK AI Engine: </span>
                  <span className="text-indigo-200">"{query}"</span>
                </div>
              </div>
              <span className="text-[10px] text-indigo-300 font-mono">Press Enter ↵</span>
            </div>
          )}

          {/* OS Apps Quick Section */}
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500 px-2 mb-1">MICK OS Applications</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    onOpenApp(app.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer flex items-center space-x-3 transition group"
                >
                  <div className="p-1.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-300 group-hover:text-indigo-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{app.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{app.description}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500 px-2 mb-1">Quick System Shortcuts</div>
            <div className="space-y-1 text-xs">
              <div
                onClick={() => {
                  onOpenApp('execution-engine');
                  onClose();
                }}
                className="p-2 bg-slate-950/40 hover:bg-slate-800/60 rounded-lg border border-slate-800/60 cursor-pointer flex items-center justify-between text-slate-300"
              >
                <div className="flex items-center space-x-2">
                  <Bot className="w-3.5 h-3.5 text-rose-400" />
                  <span>View 19 Permanent Master Agents</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Execution Engine</span>
              </div>

              <div
                onClick={() => {
                  onOpenApp('automation');
                  onClose();
                }}
                className="p-2 bg-slate-950/40 hover:bg-slate-800/60 rounded-lg border border-slate-800/60 cursor-pointer flex items-center justify-between text-slate-300"
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Automation Workflows & Job Runner</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Automation App</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between items-center">
          <span>Toggle with <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">Space</kbd></span>
          <span>MICK AI OS Enterprise Orchestrator</span>
        </div>
      </div>
    </div>
  );
};

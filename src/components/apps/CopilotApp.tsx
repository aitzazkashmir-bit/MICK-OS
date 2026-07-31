import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { Sparkles, Send, Bot, User, RefreshCw, Copy, Check, Terminal, Code, Wrench } from 'lucide-react';

interface CopilotAppProps {
  onOpenFile?: (fileName: string) => void;
  onExecuteCommand?: (cmd: string) => void;
}

export const CopilotApp: React.FC<CopilotAppProps> = ({ onExecuteCommand }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I am Mick Copilot, your AI core powered by Gemini 3.6 Flash. I can help you write code, generate shell commands, edit files, or answer complex questions. How can I assist your workflow today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'assistant' | 'coder' | 'terminal'>('assistant');

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentPrompt = input;
    setInput('');
    setLoading(true);

    try {
      const endpoint = mode === 'assistant' ? '/api/ai/mick' : '/api/ai/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          history: messages.slice(-6),
          mode,
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text || 'No output generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Error communicating with Gemini AI server: ' + (err.message || 'Unknown error'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-slate-100">Gemini 3.6 Flash Engine</h3>
            <p className="text-[10px] text-slate-400">Full-Stack Copilot with Realtime Context</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setMode('assistant')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
              mode === 'assistant' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Copilot</span>
          </button>
          <button
            onClick={() => setMode('coder')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
              mode === 'coder' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3 h-3" />
            <span>Coder</span>
          </button>
          <button
            onClick={() => setMode('terminal')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
              mode === 'terminal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Terminal AI</span>
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600/90 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                <span>{msg.timestamp}</span>

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2">
                    {onExecuteCommand && msg.content.includes('`') && (
                      <button
                        onClick={() => {
                          const match = msg.content.match(/`([^`]+)`/);
                          if (match) onExecuteCommand(match[1]);
                        }}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Run Command</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Gemini 3.6 Flash reasoning...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          'Write a React component for a dashboard stats card',
          'Explain Quantum Computing in 3 bullet points',
          'Suggest terminal commands to monitor RAM and CPU',
          'Create a python script to parse JSON logs',
        ].map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => setInput(promptText)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap transition-colors shrink-0"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              mode === 'coder'
                ? 'Ask Copilot to code or debug...'
                : mode === 'terminal'
                ? 'Ask for bash commands or shell scripts...'
                : 'Ask Gemini anything about Mick AI OS...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon, Play, Trash2, HelpCircle, CornerDownLeft } from 'lucide-react';

interface TerminalAppProps {
  initialCommand?: string;
}

interface TermHistory {
  command: string;
  output: string;
  type?: 'input' | 'output' | 'error';
}

export const TerminalApp: React.FC<TerminalAppProps> = ({ initialCommand }) => {
  const [history, setHistory] = useState<TermHistory[]>([
    {
      command: '',
      output: `Mick AI OS Shell (v3.6.0-x86_64-linux-gnu)\nType 'help', 'neofetch', 'top', or any bash command to test.`,
      type: 'output',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (initialCommand) {
      executeCmd(initialCommand);
    }
  }, [initialCommand]);

  const executeCmd = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed) return;

    if (trimmed === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }

    if (trimmed === 'help') {
      setHistory((prev) => [
        ...prev,
        { command: trimmed, output: '', type: 'input' },
        {
          command: '',
          output: `Available Mick Terminal Built-in Commands:
  - neofetch      Display system information banner
  - top / htop    Show active process list and RAM usage
  - uname -a      Show Linux kernel version details
  - clear         Clear terminal output history
  - echo <msg>    Print message to stdout
  - date          Show current system timestamp
  - <any prompt>  Ask Gemini Smart Shell to generate virtual bash stdout!`,
          type: 'output',
        },
      ]);
      setInput('');
      return;
    }

    setHistory((prev) => [...prev, { command: trimmed, output: '', type: 'input' }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/system/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });
      const data = await res.json();

      setHistory((prev) => [
        ...prev,
        { command: '', output: data.output || 'Command returned no output.', type: 'output' },
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        { command: '', output: 'Execution error: ' + (err.message || 'Server error'), type: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-mono text-xs">
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <TermIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs text-slate-200">mick@mick-ai-os:~</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => executeCmd('neofetch')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
          >
            neofetch
          </button>
          <button
            onClick={() => executeCmd('top')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
          >
            top
          </button>
          <button
            onClick={() => executeCmd('clear')}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Screen Output */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 leading-relaxed selection:bg-emerald-500/30">
        {history.map((item, idx) => (
          <div key={idx}>
            {item.type === 'input' && (
              <div className="flex items-center gap-2 text-emerald-400">
                <span>mick@ai-os:~$</span>
                <span className="text-slate-100 font-medium">{item.command}</span>
              </div>
            )}
            {item.type === 'output' && (
              <pre className="text-slate-300 whitespace-pre-wrap font-mono my-1 leading-normal">
                {item.output}
              </pre>
            )}
            {item.type === 'error' && (
              <pre className="text-rose-400 whitespace-pre-wrap font-mono my-1">{item.output}</pre>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
            <span>mick@ai-os:~$</span>
            <span>Executing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Terminal Input Line */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeCmd(input);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-t border-slate-800"
      >
        <span className="text-emerald-400 font-bold">mick@ai-os:~$</span>
        <input
          type="text"
          placeholder="Type command or query..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
          className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono text-xs"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-1 rounded text-slate-400 hover:text-emerald-400"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

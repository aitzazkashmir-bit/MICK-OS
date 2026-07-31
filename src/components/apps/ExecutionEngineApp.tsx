import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Terminal,
  Bot,
  User,
  Search,
  Briefcase,
  Mail,
  Calendar,
  CheckSquare,
  Globe,
  Code,
  Folder,
  Mic,
  Brain,
  Sliders,
  Play,
  Sparkles
} from 'lucide-react';

export interface MasterAgentStatus {
  id: string;
  name: string;
  description: string;
  status: 'Idle' | 'Planning' | 'Executing' | 'Waiting';
  queueLength: number;
  lastActive: string;
  totalExecuted: number;
  logs: string[];
}

export interface ExecutionTask {
  id: string;
  title: string;
  owner: string;
  assignedAgent: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  state: 'Queued' | 'Thinking' | 'Planning' | 'Running' | 'Waiting' | 'Completed' | 'Failed' | 'Retrying';
  progress: number;
  estimatedTimeSec: number;
  logs: string[];
  result?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemAnalytics {
  hoursSaved: number;
  completedTasks: number;
  emailsDrafted: number;
  documentsSummarized: number;
  jobsFound: number;
  applicationsPrepared: number;
  meetingsScheduled: number;
  gitCommits: number;
}

export const ExecutionEngineApp: React.FC = () => {
  const [agents, setAgents] = useState<MasterAgentStatus[]>([]);
  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'queue' | 'analytics' | 'command'>('agents');
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    fetchEngineData();
    const interval = setInterval(fetchEngineData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchEngineData = async () => {
    try {
      const [resAgents, resQueue, resAnalytics] = await Promise.all([
        fetch('/api/engine/agents'),
        fetch('/api/engine/queue'),
        fetch('/api/engine/analytics'),
      ]);
      const dataAgents = await resAgents.json();
      const dataQueue = await resQueue.json();
      const dataAnalytics = await resAnalytics.json();

      if (dataAgents.agents) setAgents(dataAgents.agents);
      if (dataQueue.queue) setTasks(dataQueue.queue);
      if (dataAnalytics.analytics) setAnalytics(dataAnalytics.analytics);
    } catch (err) {
      console.warn('Failed fetching execution engine state', err);
    }
  };

  const handleExecuteCommand = async () => {
    if (!commandInput.trim() || isExecuting) return;

    setIsExecuting(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/engine/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandInput }),
      });
      const data = await res.json();
      setLastResult(data.responseText || 'Task executed successfully.');
      setCommandInput('');
      fetchEngineData();
    } catch (err: any) {
      setLastResult(`Execution error: ${err.message || 'Failed request'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'Executive Agent': return <Cpu className="w-4 h-4 text-rose-400" />;
      case 'Planning Agent': return <Layers className="w-4 h-4 text-purple-400" />;
      case 'Research Agent': return <Search className="w-4 h-4 text-sky-400" />;
      case 'Browser Agent': return <Globe className="w-4 h-4 text-indigo-400" />;
      case 'Job Hunter Agent': return <Briefcase className="w-4 h-4 text-sky-300" />;
      case 'Email Agent': return <Mail className="w-4 h-4 text-amber-400" />;
      case 'Calendar Agent': return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'Document Agent': return <Sliders className="w-4 h-4 text-emerald-300" />;
      case 'Coding Agent': return <Code className="w-4 h-4 text-cyan-400" />;
      case 'GitHub Agent': return <Terminal className="w-4 h-4 text-teal-300" />;
      case 'Image Agent': return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'Voice Agent': return <Mic className="w-4 h-4 text-rose-300" />;
      case 'Memory Agent': return <Brain className="w-4 h-4 text-purple-300" />;
      case 'Automation Agent': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'Security Agent': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'Analytics Agent': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'Terminal Agent': return <Terminal className="w-4 h-4 text-slate-300" />;
      case 'File System Agent': return <Folder className="w-4 h-4 text-amber-300" />;
      case 'Notification Agent': return <Clock className="w-4 h-4 text-indigo-300" />;
      default: return <Bot className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'Running':
      case 'Executing': return 'bg-sky-500/20 text-sky-300 border-sky-500/40 animate-pulse';
      case 'Planning':
      case 'Thinking': return 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse';
      case 'Completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Failed': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans p-4 space-y-4 overflow-hidden select-none">
      {/* Top Engine Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-lg shadow-indigo-950/50">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              MICK ORCHESTRATOR & EXECUTION ENGINE
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                19 Permanent Master Agents
              </span>
            </h2>
            <p className="text-xs text-slate-400">Autonomous Enterprise Multi-Agent OS Pipeline for Aitzaz</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'agents' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Master Agents (19)
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'queue' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Task Queue ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Productivity & Analytics
          </button>
          <button
            onClick={() => setActiveTab('command')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'command' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Command Console
          </button>
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 hover:border-indigo-500/40 transition shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl">
                      {getAgentIcon(agent.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-white">{agent.name}</h3>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{agent.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full border font-mono ${getStateBadge(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-[11px] font-mono space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Queue Length:</span>
                    <span className="text-slate-200 font-bold">{agent.queueLength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Executed:</span>
                    <span className="text-emerald-400 font-bold">{agent.totalExecuted}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-1">
                    Log: {agent.logs[0] || 'Idle'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                No active task executions in the queue. Submit a command via Voice, Copilot, or the Command Console.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-mono">
                        {task.assignedAgent}
                      </span>
                      <h3 className="font-semibold text-xs text-white">{task.title}</h3>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full border font-mono ${getStateBadge(task.state)}`}>
                      {task.state}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Progress: {task.progress}%</span>
                      <span>Owner: {task.owner}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {task.result && (
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed">
                      <strong className="text-emerald-400 font-mono block mb-1">Result Summary:</strong>
                      {task.result}
                    </div>
                  )}

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-1">
                    {task.logs.map((log, idx) => (
                      <div key={idx} className="truncate">{log}</div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Hours Saved</span>
                <div className="text-2xl font-bold text-emerald-400">{analytics?.hoursSaved || 48.5} hrs</div>
                <div className="text-[10px] text-slate-500">Autonomous execution vs manual work</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Completed Tasks</span>
                <div className="text-2xl font-bold text-sky-400">{analytics?.completedTasks || 142}</div>
                <div className="text-[10px] text-slate-500">Master agent tasks executed</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Emails Drafted</span>
                <div className="text-2xl font-bold text-amber-400">{analytics?.emailsDrafted || 38}</div>
                <div className="text-[10px] text-slate-500">Gmail responses & outreaches</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Docs Summarized</span>
                <div className="text-2xl font-bold text-purple-400">{analytics?.documentsSummarized || 26}</div>
                <div className="text-[10px] text-slate-500">Document AI & PDF analyses</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Jobs Found</span>
                <div className="text-2xl font-bold text-sky-300">{analytics?.jobsFound || 94}</div>
                <div className="text-[10px] text-slate-500">USA remote call center positions</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">CVs Prepared</span>
                <div className="text-2xl font-bold text-indigo-400">{analytics?.applicationsPrepared || 18}</div>
                <div className="text-[10px] text-slate-500">Tailored CV & Cover Letters</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Meetings Scheduled</span>
                <div className="text-2xl font-bold text-emerald-300">{analytics?.meetingsScheduled || 12}</div>
                <div className="text-[10px] text-slate-500">Google Calendar interviews</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Git Commits</span>
                <div className="text-2xl font-bold text-teal-300">{analytics?.gitCommits || 29}</div>
                <div className="text-[10px] text-slate-500">GitHub Agent code commits</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'command' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                MICK Execution Engine Console
              </h3>
              <p className="text-[11px] text-slate-400">
                Submit an executive instruction. MICK will assign the optimal Master Agent, plan steps, and execute directly.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
                placeholder="e.g. Find USA remote call center jobs and draft an email response..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none placeholder:text-slate-600"
              />
              <button
                onClick={handleExecuteCommand}
                disabled={isExecuting || !commandInput.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-900/40 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isExecuting ? 'Executing...' : 'Run Command'}</span>
              </button>
            </div>

            {lastResult && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-200">
                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                  <span>Execution Output</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="leading-relaxed font-sans">{lastResult}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

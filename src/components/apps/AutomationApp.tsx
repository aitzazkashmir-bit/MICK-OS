import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  Mail,
  Calendar,
  Briefcase,
  Globe,
  Folder,
  ShieldCheck,
  Plus,
  ArrowRight,
  Terminal,
  Activity,
  Cpu,
  Sparkles,
  Search,
  Check
} from 'lucide-react';

export interface WorkflowAction {
  id: string;
  type: string;
  config: Record<string, any>;
  requiresApproval?: boolean;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  condition: { field: string; operator: string; value: string };
  actions: WorkflowAction[];
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  createdAt: string;
  lastRunAt?: string;
  runCount: number;
}

export interface AutomationJob {
  id: string;
  workflowId?: string;
  workflowName: string;
  triggerEvent: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'WAITING_APPROVAL';
  progress: number;
  currentStepIndex: number;
  totalSteps: number;
  stepsLog: {
    stepId: string;
    actionType: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    output?: string;
    startedAt?: string;
    completedAt?: string;
  }[];
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceStatus {
  name: string;
  status: string;
  icon: string;
  lastSync: string;
}

export const AutomationApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workflows' | 'jobs' | 'document-ai' | 'services'>('dashboard');
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);

  // Workflow Modal state
  const [showCreateWf, setShowCreateWf] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfTrigger, setNewWfTrigger] = useState('gmail_new_email');

  // Document AI state
  const [docText, setDocText] = useState('');
  const [docAction, setDocAction] = useState<'summarize' | 'translate' | 'extract_tables' | 'qa'>('summarize');
  const [docQuery, setDocQuery] = useState('');
  const [docResult, setDocResult] = useState<string | null>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [resWf, resJobs, resServ] = await Promise.all([
        fetch('/api/automation/workflows'),
        fetch('/api/automation/jobs'),
        fetch('/api/automation/services'),
      ]);

      const dataWf = await resWf.json();
      const dataJobs = await resJobs.json();
      const dataServ = await resServ.json();

      if (dataWf.workflows) setWorkflows(dataWf.workflows);
      if (dataJobs.jobs) setJobs(dataJobs.jobs);
      if (dataServ.services) setServices(dataServ.services);
    } catch (e) {
      console.warn('Error fetching automation data', e);
    }
  };

  const handleToggleWorkflow = async (id: string) => {
    try {
      await fetch(`/api/automation/workflows/${id}/toggle`, { method: 'PATCH' });
      fetchData();
    } catch (e) {
      console.error('Toggle workflow error', e);
    }
  };

  const handleTriggerWorkflow = async (workflowId: string) => {
    try {
      await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, payload: { triggerEvent: 'Owner Manual Activation' } }),
      });
      fetchData();
      setActiveTab('jobs');
    } catch (e) {
      console.error('Trigger workflow error', e);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await fetch(`/api/automation/jobs/${jobId}/retry`, { method: 'POST' });
      fetchData();
    } catch (e) {
      console.error('Retry job error', e);
    }
  };

  const handleCreateWorkflowSubmit = async () => {
    if (!newWfName.trim()) return;

    try {
      await fetch('/api/automation/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWfName,
          trigger: newWfTrigger,
          condition: { field: 'subject', operator: 'always', value: '' },
          actions: [
            { id: 'act_1', type: 'summarize_email', config: {} },
            { id: 'act_2', type: 'create_task', config: {} },
            { id: 'act_3', type: 'notify_owner', config: {} },
          ],
          status: 'ACTIVE',
        }),
      });

      setNewWfName('');
      setShowCreateWf(false);
      fetchData();
    } catch (e) {
      console.error('Create workflow error', e);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!docText.trim() || isAnalyzingDoc) return;

    setIsAnalyzingDoc(true);
    setDocResult(null);

    try {
      const res = await fetch('/api/automation/document-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: docText, action: docAction, query: docQuery }),
      });
      const data = await res.json();
      setDocResult(data.result || 'Analysis completed.');
    } catch (err: any) {
      setDocResult(`Analysis failed: ${err.message || 'Error processing document'}`);
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const getServiceIcon = (name: string) => {
    switch (name) {
      case 'Gmail': return <Mail className="w-4 h-4 text-rose-400" />;
      case 'Google Calendar': return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'Google Drive': return <Folder className="w-4 h-4 text-amber-400" />;
      case 'Browser Automation': return <Globe className="w-4 h-4 text-sky-400" />;
      case 'Job Hunter Pro': return <Briefcase className="w-4 h-4 text-indigo-400" />;
      default: return <FileText className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans p-4 space-y-4 overflow-hidden select-none">
      {/* Top OS Automation Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 shadow-lg shadow-yellow-950/50">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              MICK AUTOMATION ENGINE
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-mono">
                Real Workflows
              </span>
            </h2>
            <p className="text-xs text-slate-400">Autonomous Trigger Pipelines, Smart Job Runner & Document AI for Aitzaz</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'dashboard' ? 'bg-yellow-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'workflows' ? 'bg-yellow-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'jobs' ? 'bg-yellow-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Smart Job Runner ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('document-ai')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'document-ai' ? 'bg-yellow-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Document AI
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'services' ? 'bg-yellow-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Connected Services
          </button>
        </div>
      </div>

      {/* Main Container View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Vitals & Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Active Workflows</span>
                <div className="text-2xl font-bold text-white font-mono">
                  {workflows.filter((w) => w.status === 'ACTIVE').length} / {workflows.length}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Jobs Running</span>
                <div className="text-2xl font-bold text-sky-400 font-mono">
                  {jobs.filter((j) => j.status === 'RUNNING').length}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Completed Today</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {jobs.filter((j) => j.status === 'COMPLETED').length}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Connected Services</span>
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  {services.filter((s) => s.status === 'CONNECTED').length} / {services.length}
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Jobs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-yellow-400" />
                    Recent Job Runner Executions
                  </h3>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-2">
                  {jobs.slice(0, 4).map((j) => (
                    <div key={j.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{j.workflowName}</div>
                        <p className="text-[10px] text-slate-400 truncate">{j.triggerEvent}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        j.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        j.status === 'RUNNING' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30 animate-pulse' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {j.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Health */}
              <div className="md:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Service Sync Status
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  {services.map((s, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getServiceIcon(s.name)}
                        <span className="font-medium text-slate-200">{s.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-mono rounded border ${
                        s.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOWS TAB */}
        {activeTab === 'workflows' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-white">Automated Trigger Pipelines</h3>
                <p className="text-[11px] text-slate-400">Configure IF-THIS-THEN-THAT autonomous OS execution rules for Aitzaz</p>
              </div>
              <button
                onClick={() => setShowCreateWf(true)}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workflow</span>
              </button>
            </div>

            {/* Create Workflow Modal Form */}
            {showCreateWf && (
              <div className="p-4 bg-slate-900 border border-yellow-500/40 rounded-2xl space-y-3 animate-fade-in shadow-2xl">
                <h4 className="text-xs font-bold text-white">Create New Workflow</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Workflow Name (e.g. Auto-Reply & Task for Important Emails)"
                    value={newWfName}
                    onChange={(e) => setNewWfName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-yellow-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <select
                    value={newWfTrigger}
                    onChange={(e) => setNewWfTrigger(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-yellow-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="gmail_new_email">IF New Gmail Arrives</option>
                    <option value="task_created">IF Task Created</option>
                    <option value="job_found">IF Remote Job Match Found</option>
                    <option value="scheduled_cron">IF Scheduled Daily Trigger</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setShowCreateWf(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWorkflowSubmit}
                    className="px-4 py-1.5 bg-yellow-600 text-white font-bold text-xs rounded-xl"
                  >
                    Save & Activate
                  </button>
                </div>
              </div>
            )}

            {/* List of Workflows */}
            <div className="space-y-3">
              {workflows.map((wf) => (
                <div key={wf.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-yellow-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{wf.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">Trigger: {wf.trigger} • Executions: {wf.runCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTriggerWorkflow(wf.id)}
                        className="px-3 py-1 bg-yellow-600/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-600/30 text-[11px] rounded-lg font-mono flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run Now</span>
                      </button>

                      <button
                        onClick={() => handleToggleWorkflow(wf.id)}
                        className={`px-3 py-1 text-[11px] rounded-lg font-mono border ${
                          wf.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {wf.status}
                      </button>
                    </div>
                  </div>

                  {/* Actions Timeline Flow */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center space-x-2 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    <span className="text-yellow-400 font-bold shrink-0">IF {wf.trigger}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    {wf.actions.map((act, i) => (
                      <React.Fragment key={act.id}>
                        <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 shrink-0">
                          {act.type}
                        </span>
                        {i < wf.actions.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SMART JOB RUNNER TAB */}
        {activeTab === 'jobs' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white">Smart Job Runner History & Retry Queue</h3>
            {jobs.map((job) => (
              <div key={job.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">{job.workflowName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Trigger Event: {job.triggerEvent} • Created: {new Date(job.createdAt).toLocaleTimeString()}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {job.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        className="px-2.5 py-1 bg-rose-600/20 text-rose-300 border border-rose-500/30 text-[10px] rounded font-mono flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry Job
                      </button>
                    )}
                    <span className={`px-2.5 py-1 text-[10px] rounded-full border font-mono ${
                      job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      job.status === 'RUNNING' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30 animate-pulse' :
                      job.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>

                {/* Steps execution logs */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Execution Steps ({job.totalSteps})</div>
                  {job.stepsLog.map((step, idx) => (
                    <div key={idx} className="flex flex-col space-y-0.5 border-b border-slate-900 pb-1 last:border-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-yellow-400 font-semibold">{step.actionType}</span>
                        <span className={`text-[9px] ${step.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {step.status}
                        </span>
                      </div>
                      {step.output && <div className="text-[10px] text-slate-300 font-sans">{step.output}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DOCUMENT AI TAB */}
        {activeTab === 'document-ai' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                MICK Document AI Analyzer
              </h3>
              <p className="text-[11px] text-slate-400">
                Paste PDF/DOCX text, emails, or contract documents for instant summarization, translation, structured table extraction, or QA.
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                rows={6}
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste document text, job description, email content, or raw notes here..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500 rounded-xl p-3 text-xs text-white outline-none custom-scrollbar"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setDocAction('summarize')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition ${docAction === 'summarize' ? 'bg-yellow-600 text-white font-bold' : 'bg-slate-950 text-slate-400'}`}
                  >
                    Summarize
                  </button>
                  <button
                    onClick={() => setDocAction('translate')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition ${docAction === 'translate' ? 'bg-yellow-600 text-white font-bold' : 'bg-slate-950 text-slate-400'}`}
                  >
                    Translate (EN/UR)
                  </button>
                  <button
                    onClick={() => setDocAction('extract_tables')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition ${docAction === 'extract_tables' ? 'bg-yellow-600 text-white font-bold' : 'bg-slate-950 text-slate-400'}`}
                  >
                    Extract Tables/Data
                  </button>
                  <button
                    onClick={() => setDocAction('qa')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition ${docAction === 'qa' ? 'bg-yellow-600 text-white font-bold' : 'bg-slate-950 text-slate-400'}`}
                  >
                    Q&A Query
                  </button>
                </div>

                <button
                  onClick={handleAnalyzeDocument}
                  disabled={isAnalyzingDoc || !docText.trim()}
                  className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAnalyzingDoc ? 'Analyzing...' : 'Analyze Document'}</span>
                </button>
              </div>

              {docAction === 'qa' && (
                <input
                  type="text"
                  value={docQuery}
                  onChange={(e) => setDocQuery(e.target.value)}
                  placeholder="Enter your specific question about the document..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              )}

              {docResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-200">
                  <div className="text-[10px] text-emerald-400 font-mono font-bold">Document AI Analysis Output</div>
                  <div className="leading-relaxed font-sans whitespace-pre-wrap">{docResult}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONNECTED SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white">Integrations & Service Health Monitor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((s, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                      {getServiceIcon(s.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{s.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Last Sync: {s.lastSync}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] rounded-full border font-mono ${
                    s.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

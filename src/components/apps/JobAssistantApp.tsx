import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  FileText, 
  Search, 
  Plus, 
  Sparkles, 
  Building2, 
  DollarSign, 
  Calendar, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  Bot,
  UserCheck
} from 'lucide-react';

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  salaryRange?: string;
  jobUrl?: string;
  status: 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  appliedDate?: string;
  notes?: string;
  coverLetter?: string;
  interviewDate?: string;
}

export const JobAssistantApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'cv' | 'coverLetter' | 'interview'>('applications');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state for Job Application
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('Remote');
  const [salaryRange, setSalaryRange] = useState('$180,000 - $230,000');
  const [jobUrl, setJobUrl] = useState('');
  const [status, setStatus] = useState<JobApplication['status']>('Applied');
  const [notes, setNotes] = useState('');

  // CV & Cover Letter Generation state
  const [cvContent, setCvContent] = useState<string>('');
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [generatingLetter, setGeneratingLetter] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedAppForCover, setSelectedAppForCover] = useState<string>('');

  // Interview Prep Questions state
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState<boolean>(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs/applications');
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
    } catch (e) {
      console.error('Failed to fetch applications', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCv = async () => {
    try {
      const res = await fetch('/api/jobs/cv');
      const data = await res.json();
      if (data.cv) {
        setCvContent(data.cv.summary || '');
      }
    } catch (e) {
      console.error('Failed to fetch CV profile', e);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchCv();
  }, []);

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !jobTitle) return;

    try {
      const res = await fetch('/api/jobs/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          jobTitle,
          location,
          salaryRange,
          jobUrl,
          status,
          appliedDate: new Date().toISOString().split('T')[0],
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications([data.application, ...applications]);
        setShowAddModal(false);
        setCompanyName('');
        setJobTitle('');
        setNotes('');
      }
    } catch (e) {
      console.error('Failed to add application', e);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setGeneratingLetter(true);
    try {
      const targetApp = applications.find(a => a.id === selectedAppForCover) || applications[0];
      const targetCompany = targetApp ? targetApp.companyName : "Target Company";
      const targetRole = targetApp ? targetApp.jobTitle : "Senior AI Software Engineer";

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a tailored, professional cover letter for Aitzaz applying for the position of "${targetRole}" at "${targetCompany}". Highlight expertise in building MICK AI OS, Gemini 3.6 Flash, TypeScript, and autonomous agent systems. Keep it impactful, sleek, and under 300 words.`,
        }),
      });
      const data = await res.json();
      setCoverLetterText(data.text || "Cover letter generation completed.");
    } catch (e) {
      console.error("Cover letter generation failed", e);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleGenerateInterviewPrep = async () => {
    setGeneratingQuestions(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Provide 5 technical interview questions and strategic answer key for Aitzaz for a Senior AI Engineer role focused on Gemini 3.6 Flash, Function Calling, OAuth, and Full-Stack System Architecture.`,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setInterviewQuestions([data.text]);
      }
    } catch (e) {
      console.error("Interview prep failed", e);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const getStatusColor = (st: JobApplication['status']) => {
    switch (st) {
      case 'Interviewing': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Offer': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Applied': return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'Saved': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'Rejected': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans p-4 space-y-4 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              MICK Job Assistant
              <span className="px-2 py-0.5 text-xs rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Career Core
              </span>
            </h2>
            <p className="text-xs text-slate-400">Manage CVs, job search, cover letters & application tracker</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-lg shadow-indigo-950/50 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Job</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-900/60 p-1 border border-slate-800/80 rounded-xl text-xs">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'applications'
              ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Applications Tracker ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cv')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'cv'
              ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>CV & Profile Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('coverLetter')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'coverLetter'
              ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cover Letter Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('interview')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'interview'
              ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Interview & Salary Tracker</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'applications' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
                No job applications tracked yet. Click "Track New Job" to begin.
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 rounded-2xl transition space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        {app.companyName}
                        <span className={`px-2.5 py-0.5 text-[10px] font-medium border rounded-full ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </h3>
                      <p className="text-xs text-indigo-300 font-medium">{app.jobTitle}</p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      <div>{app.location || 'Remote'}</div>
                      <div className="text-emerald-400 font-semibold">{app.salaryRange}</div>
                    </div>
                  </div>

                  {app.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {app.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Applied: {app.appliedDate || 'N/A'}
                    </span>
                    {app.interviewDate && (
                      <span className="text-purple-400 font-semibold">
                        Interview: {app.interviewDate}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'cv' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Owner Executive CV Summary (Aitzaz)
                </h3>
                <span className="text-xs text-slate-400 font-mono">Version 1.0 (Live)</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p><strong>Name:</strong> Aitzaz (Owner)</p>
                <p><strong>Role:</strong> Lead AI Operating System Architect & Senior Full-Stack Engineer</p>
                <p><strong>Core Stack:</strong> Gemini 3.6 Flash, TypeScript, Express, React 18, Tailwind CSS, Function Calling, OAuth 2.0</p>
                <p className="text-slate-400 leading-relaxed pt-1">
                  Specialized in building full-stack web operating systems with server-side AI execution, real-time memory engines, and multi-provider token management.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coverLetter' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Select Target Application</h3>
                  <p className="text-xs text-slate-400">Generate a tailored cover letter powered by Gemini 3.6 Flash</p>
                </div>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={generatingLetter}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-lg shadow-indigo-950/50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${generatingLetter ? 'animate-spin' : ''}`} />
                  <span>{generatingLetter ? 'Generating...' : 'Generate Letter'}</span>
                </button>
              </div>

              <select
                value={selectedAppForCover}
                onChange={(e) => setSelectedAppForCover(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.companyName} - {app.jobTitle}
                  </option>
                ))}
              </select>
            </div>

            {coverLetterText && (
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-indigo-300">Generated Cover Letter</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coverLetterText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {coverLetterText}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'interview' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Technical Interview Simulator</h3>
                  <p className="text-xs text-slate-400">Generate targeted interview prep questions for Aitzaz</p>
                </div>
                <button
                  onClick={handleGenerateInterviewPrep}
                  disabled={generatingQuestions}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
                >
                  <Bot className={`w-3.5 h-3.5 ${generatingQuestions ? 'animate-spin' : ''}`} />
                  <span>Generate Questions</span>
                </button>
              </div>
            </div>

            {interviewQuestions.length > 0 && (
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {interviewQuestions[0]}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Track New Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Track Job Application
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddApplication} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google DeepMind"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior AI Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Salary Range</label>
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Notes & Next Steps</label>
                <textarea
                  rows={2}
                  placeholder="Recruiter contact or technical interview date..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-md shadow-indigo-950/50"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

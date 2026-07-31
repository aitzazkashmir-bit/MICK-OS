import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  Inbox, 
  FileEdit, 
  Tag, 
  Clock,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  category: 'Important' | 'Job Hunt' | 'Updates' | 'Promotions' | 'System';
  read: boolean;
}

export interface DraftEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'Draft' | 'Pending Approval' | 'Sent';
  createdAt: string;
}

export const EmailAgentApp: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [drafts, setDrafts] = useState<DraftEmail[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'drafts'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  // Approval modal state
  const [approvingDraft, setApprovingDraft] = useState<DraftEmail | null>(null);
  const [sending, setSending] = useState<boolean>(false);

  // Summarize state
  const [inboxSummary, setInboxSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState<boolean>(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      setIsConnected(data.isConnected);
      setEmails(data.emails || []);
      setDrafts(data.drafts || []);
      if (data.emails && data.emails.length > 0) {
        setSelectedEmail(data.emails[0]);
      }
    } catch (e) {
      console.error('Failed to fetch emails', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSummarizeInbox = async () => {
    setSummarizing(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Summarize Aitzaz's email inbox into 3 direct bullet points. Highlighting important recruiter emails or system alerts. Inbox items: ${JSON.stringify(emails)}`,
        }),
      });
      const data = await res.json();
      setInboxSummary(data.text || 'Inbox summarized.');
    } catch (e) {
      console.error('Failed to summarize inbox', e);
    } finally {
      setSummarizing(false);
    }
  };

  const handleApproveAndSend = async (draftId: string) => {
    setSending(true);
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      });
      const data = await res.json();
      if (data.success) {
        setDrafts(drafts.map(d => d.id === draftId ? { ...d, status: 'Sent' } : d));
        setApprovingDraft(null);
      }
    } catch (e) {
      console.error('Failed to send email', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans p-4 space-y-4 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              MICK Email & Workspace Agent
              <span className={`px-2 py-0.5 text-xs rounded-md border font-mono ${isConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {isConnected ? 'Gmail OAuth Active' : 'OAuth Standby'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Read, summarize, and draft replies. Never sends without explicit approval.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSummarizeInbox}
            disabled={summarizing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition shadow-lg shadow-sky-950/50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${summarizing ? 'animate-spin' : ''}`} />
            <span>AI Summarize Inbox</span>
          </button>

          <button
            onClick={fetchEmails}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Safety Lock Active: MICK will create email drafts, but will NEVER dispatch an email without Aitzaz's manual approval.</span>
        </span>
      </div>

      {/* AI Summary Box */}
      {inboxSummary && (
        <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl text-xs text-sky-200 leading-relaxed font-sans">
          <span className="font-bold text-sky-300 flex items-center gap-1 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> MICK AI Inbox Briefing:
          </span>
          <pre className="whitespace-pre-wrap font-sans text-slate-200">{inboxSummary}</pre>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-900/60 p-1 border border-slate-800/80 rounded-xl text-xs">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'inbox'
              ? 'bg-slate-800 text-sky-400 border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inbox ({emails.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drafts')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'drafts'
              ? 'bg-slate-800 text-sky-400 border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Drafts & Approvals ({drafts.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {activeTab === 'inbox' ? (
          <>
            {/* List Column */}
            <div className="md:col-span-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {emails.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedEmail(msg)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition space-y-1 ${
                    selectedEmail?.id === msg.id
                      ? 'bg-slate-800 border-sky-500/40 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span className="truncate max-w-[140px] font-semibold text-slate-200">{msg.sender}</span>
                    <span>{new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="font-semibold text-white truncate">{msg.subject}</div>
                  <p className="text-slate-400 text-[11px] line-clamp-1">{msg.snippet}</p>
                </div>
              ))}
            </div>

            {/* Email View Column */}
            <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              {selectedEmail ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-sky-400 font-semibold">{selectedEmail.sender}</span>
                      <span className="px-2 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded-md text-slate-300">
                        {selectedEmail.category}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white">{selectedEmail.subject}</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedEmail.body || selectedEmail.snippet}
                  </p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Select an email to view details.
                </div>
              )}
            </div>
          </>
        ) : (
          /* Drafts & Approvals View */
          <div className="md:col-span-3 overflow-y-auto space-y-3 custom-scrollbar">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2 flex items-start justify-between"
              >
                <div className="space-y-1 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">To: {draft.to}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full border ${
                      draft.status === 'Sent' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {draft.status}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-sky-300">{draft.subject}</div>
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    {draft.body}
                  </p>
                </div>

                {draft.status !== 'Sent' && (
                  <button
                    onClick={() => setApprovingDraft(draft)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Approve & Send</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {approvingDraft && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Approve Email Dispatch</h3>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>Are you sure you want to approve sending this email?</p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div><strong>To:</strong> {approvingDraft.to}</div>
                <div><strong>Subject:</strong> {approvingDraft.subject}</div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setApprovingDraft(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveAndSend(approvingDraft.id)}
                disabled={sending}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Dispatching...' : 'Confirm & Dispatch Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

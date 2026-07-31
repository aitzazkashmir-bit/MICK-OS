import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  Plus, 
  User, 
  Target, 
  FolderGit2, 
  FileText, 
  BookMarked, 
  Bookmark, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const MemoryApp: React.FC = () => {
  const [memoryData, setMemoryData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [addType, setAddType] = useState<'preference' | 'goal' | 'project' | 'note'>('preference');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [value, setValue] = useState('');

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      setMemoryData(data);
    } catch (e) {
      console.error('Failed to load memory', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await fetch('/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResults(data.result);
    } catch (e) {
      console.error('Memory search error', e);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/memory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: addType, title, content, value }),
      });
      const data = await res.json();
      if (data.success) {
        setMemoryData(data.memory);
        setShowAddModal(false);
        setTitle('');
        setContent('');
        setValue('');
      }
    } catch (e) {
      console.error('Failed to add memory', e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans p-4 space-y-4 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              MICK Persistent Memory Core
              <span className="px-2 py-0.5 text-xs rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                Long-Term
              </span>
            </h2>
            <p className="text-xs text-slate-400">Owner preferences, career goals, projects, and notes surviving refresh</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchMemory}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium shadow-lg shadow-purple-950/50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Memory</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search long-term memory (e.g. preferences, CV, goals)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700"
        >
          Search Memory
        </button>
      </form>

      {/* Search Results overlay */}
      {searchResults !== null && (
        <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200 font-mono space-y-1">
          <div className="font-bold flex items-center gap-1 text-purple-300">
            <Sparkles className="w-3.5 h-3.5" /> Search Query Results:
          </div>
          <pre className="whitespace-pre-wrap font-sans text-slate-300">{searchResults}</pre>
        </div>
      )}

      {/* Memory Categories Grid */}
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading persistent memory core...</div>
        ) : !memoryData ? (
          <div className="text-center py-12 text-slate-500 text-xs">Memory empty.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preferences */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <User className="w-4 h-4" /> Owner Preferences
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {memoryData.ownerPreferences?.map((p: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Career Goals */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Target className="w-4 h-4" /> Career Goals
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {memoryData.careerGoals?.map((g: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Active Projects */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <FolderGit2 className="w-4 h-4" /> Active Projects
              </h3>
              <div className="space-y-2">
                {memoryData.projects?.map((proj: any) => (
                  <div key={proj.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <div className="font-semibold text-white flex justify-between">
                      <span>{proj.name}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Notes */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileText className="w-4 h-4" /> Important Memory Notes
              </h3>
              <div className="space-y-2">
                {memoryData.importantNotes?.map((note: any) => (
                  <div key={note.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <div className="font-semibold text-slate-200">{note.title}</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Record Long-Term Memory
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Memory Type</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="preference">Owner Preference</option>
                  <option value="goal">Career Goal</option>
                  <option value="project">Project</option>
                  <option value="note">Important Note</option>
                </select>
              </div>

              {(addType === 'preference' || addType === 'goal') ? (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Memory Detail *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter goal or preference..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Description / Content</label>
                    <textarea
                      rows={3}
                      placeholder="Content details..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                </>
              )}

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
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg shadow-md shadow-purple-950/50"
                >
                  Save to Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

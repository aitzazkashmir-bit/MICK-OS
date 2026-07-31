import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Filter, 
  RefreshCw,
  Tag
} from 'lucide-react';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  completedAt?: string;
}

export const TaskEngineApp: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Career');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          dueDate: dueDate || undefined,
          recurring,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks([data.task, ...tasks]);
        setShowAddModal(false);
        setTitle('');
        setDescription('');
      }
    } catch (e) {
      console.error('Failed to create task', e);
    }
  };

  const handleStatusChange = async (id: string, newStatus: TaskItem['status']) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.map(t => t.id === id ? data.task : t));
      }
    } catch (e) {
      console.error('Failed to update task status', e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete task', e);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const getPriorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'urgent': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'high': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'medium': return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'low': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans p-4 space-y-4 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              MICK Task Engine
              <span className="px-2 py-0.5 text-xs rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Real State
              </span>
            </h2>
            <p className="text-xs text-slate-400">Manage owner tasks, reminders, schedules & priorities</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTasks}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-lg shadow-emerald-950/50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-slate-900/60 p-1.5 border border-slate-800/80 rounded-xl text-xs">
        <div className="flex space-x-1">
          {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition capitalize ${
                statusFilter === st
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="text-slate-400 text-xs px-2 font-mono">
          Total: {filteredTasks.length}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-8 text-center">
            <CheckSquare className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-sm font-medium text-slate-400">No tasks found</p>
            <p className="text-xs text-slate-500 mt-1">Create a new task or ask MICK AI to add one for you.</p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 bg-slate-900/80 hover:bg-slate-900 border rounded-xl transition flex items-start justify-between space-x-3 group ${
                t.status === 'completed'
                  ? 'border-slate-800/60 opacity-70'
                  : t.status === 'cancelled'
                  ? 'border-slate-800/40 opacity-50 line-through'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <button
                  onClick={() =>
                    handleStatusChange(t.id, t.status === 'completed' ? 'pending' : 'completed')
                  }
                  className="mt-0.5 text-slate-500 hover:text-emerald-400 transition"
                >
                  {t.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-slate-600 rounded-md hover:border-emerald-400 transition" />
                  )}
                </button>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-100 truncate">{t.title}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full uppercase tracking-wider ${getPriorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded-md border border-slate-700/50 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5 text-emerald-400" />
                      {t.category}
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>
                  )}

                  <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1 font-mono">
                    {t.dueDate && (
                      <span className="flex items-center space-x-1 text-sky-400/90">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {t.dueDate}</span>
                      </span>
                    )}
                    {t.recurring !== 'none' && (
                      <span className="flex items-center space-x-1 text-purple-400">
                        <Clock className="w-3 h-3" />
                        <span>Recurring: {t.recurring}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition">
                {t.status !== 'completed' && t.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'cancelled')}
                    className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                    title="Cancel Task"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(t.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Create New Task
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule MICK OS code review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Career">Career</option>
                    <option value="Job Hunt">Job Hunt</option>
                    <option value="System">System</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Recurring</label>
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-md shadow-emerald-950/50"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

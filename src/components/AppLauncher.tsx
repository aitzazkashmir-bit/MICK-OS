import React, { useState } from 'react';
import { SYSTEM_APPS } from '../data';
import { AppId, AppMetadata } from '../types';
import { 
  Search, 
  Sparkles, 
  Image, 
  Terminal, 
  Folder, 
  Code, 
  FileText, 
  Globe, 
  Calculator, 
  Settings,
  Shield,
  Briefcase,
  CheckSquare,
  Brain,
  Mic,
  Power,
  RotateCcw,
  Zap
} from 'lucide-react';

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: AppId) => void;
  onReboot: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Image,
  Terminal,
  Folder,
  Code,
  FileText,
  Globe,
  Calculator,
  Settings,
  Shield,
  Briefcase,
  CheckSquare,
  Brain,
  Mic,
};

export const AppLauncher: React.FC<AppLauncherProps> = ({
  isOpen,
  onClose,
  onOpenApp,
  onReboot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'AI Tools', 'Productivity', 'System', 'Utilities'];

  const filteredApps = SYSTEM_APPS.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div 
      className="fixed inset-0 z-40 flex items-end justify-start pb-16 pl-4 sm:pl-6 bg-slate-950/40 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md sm:max-w-xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl text-slate-100 flex flex-col max-h-[80vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Launcher Header & Search */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              id="launcher-search-input"
              type="text"
              placeholder="Search apps, tools, or Gemini commands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96">
          {filteredApps.map((app) => {
            const IconComponent = ICON_MAP[app.icon] || Sparkles;

            return (
              <button
                key={app.id}
                id={`launcher-app-${app.id}`}
                onClick={() => {
                  onOpenApp(app.id);
                  onClose();
                }}
                className="group relative flex flex-col items-start p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/90 border border-slate-800/60 hover:border-indigo-500/50 transition-all text-left"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {app.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {app.badge}
                    </span>
                  )}
                </div>

                <div className="font-semibold text-sm text-slate-100 group-hover:text-indigo-200 transition-colors">
                  {app.name}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                  {app.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Launcher Footer / Power Actions */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-slate-300">Mick AI OS v3.6</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onReboot();
                onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Reboot OS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

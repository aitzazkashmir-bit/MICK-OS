import React, { useState } from 'react';
import { Wallpaper, OSTheme, SystemStats } from '../../types';
import { WALLPAPERS } from '../../data';
import { Settings, Image, Shield, Cpu, Sparkles, RefreshCw, Check } from 'lucide-react';

interface SettingsAppProps {
  currentWallpaper: Wallpaper;
  onSelectWallpaper: (wp: Wallpaper) => void;
  stats: SystemStats;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  stats,
}) => {
  const [activeTab, setActiveTab] = useState<'wallpaper' | 'system' | 'ai'>('wallpaper');
  const [customUrl, setCustomUrl] = useState('');

  const handleApplyCustomWp = () => {
    if (!customUrl.trim()) return;
    const customWp: Wallpaper = {
      id: `custom-${Date.now()}`,
      name: 'Custom User Wallpaper',
      url: customUrl,
      style: 'dark',
      isCustom: true,
    };
    onSelectWallpaper(customWp);
    setCustomUrl('');
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-100 text-xs">
      {/* Sidebar navigation */}
      <div className="w-48 p-3 bg-slate-900 border-r border-slate-800 flex flex-col gap-1">
        <button
          onClick={() => setActiveTab('wallpaper')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-colors ${
            activeTab === 'wallpaper' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Desktop & Wallpaper</span>
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-colors ${
            activeTab === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>System & Hardware</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-colors ${
            activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI & Gemini Engine</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'wallpaper' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Desktop Wallpapers</h3>
              <p className="text-slate-400 text-xs">
                Select a high-resolution wallpaper or provide your own custom image URL.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {WALLPAPERS.map((wp) => {
                const isSelected = currentWallpaper.id === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => onSelectWallpaper(wp)}
                    className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img src={wp.url} alt={wp.name} className="w-full h-28 object-cover group-hover:scale-105 transition-transform" />
                    <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{wp.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="block font-semibold text-slate-300">Custom Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/my-wallpaper.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleApplyCustomWp}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">System Health & Metrics</h3>
              <p className="text-slate-400">Live hardware telemetry monitored by Mick Kernel.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-400 font-semibold">CPU Usage</div>
                <div className="text-2xl font-black text-indigo-400">{stats.cpuUsage}%</div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${stats.cpuUsage}%` }} />
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-400 font-semibold">RAM Usage</div>
                <div className="text-2xl font-black text-emerald-400">{stats.ramUsage}%</div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${stats.ramUsage}%` }} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-200">OS Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                <div>OS Name: <span className="text-slate-200 font-medium">Mick AI OS</span></div>
                <div>Kernel: <span className="text-slate-200 font-medium">5.15.0-mick-core</span></div>
                <div>Server Runtime: <span className="text-slate-200 font-medium">Express Full-Stack</span></div>
                <div>Port Ingress: <span className="text-slate-200 font-medium">Port 3000 (0.0.0.0)</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Gemini AI Copilot Configuration</h3>
              <p className="text-slate-400">Manage LLM models and API secrets.</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Active Text & Reasoning Engine</div>
                  <div className="text-slate-400">gemini-3.6-flash</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">Active Image Engine</div>
                  <div className="text-slate-400">gemini-3.1-flash-lite-image</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Online
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { SYSTEM_APPS } from '../data';
import { AppId, WindowState, OSNotification, SystemStats } from '../types';
import { 
  Sparkles, 
  Search, 
  Bell, 
  Wifi, 
  Battery, 
  Volume2, 
  Maximize2, 
  Grid, 
  Settings, 
  Activity,
  ChevronUp
} from 'lucide-react';

interface TaskbarProps {
  openWindows: WindowState[];
  activeWindowId: string | null;
  onOpenApp: (appId: AppId) => void;
  onToggleWindow: (windowId: string) => void;
  onToggleLauncher: () => void;
  isLauncherOpen: boolean;
  onToggleNotifications: () => void;
  notifications: OSNotification[];
  stats: SystemStats;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  openWindows,
  activeWindowId,
  onOpenApp,
  onToggleWindow,
  onToggleLauncher,
  isLauncherOpen,
  onToggleNotifications,
  notifications,
  stats,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/80 text-slate-200 z-50 flex items-center justify-between px-3 select-none">
      {/* Left: Start Button & Quick Search */}
      <div className="flex items-center gap-2">
        <button
          id="taskbar-launcher-btn"
          onClick={onToggleLauncher}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${
            isLauncherOpen
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-100'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
            M
          </div>
          <span className="font-semibold text-sm tracking-wide hidden sm:inline">Mick OS</span>
          <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLauncherOpen ? 'rotate-180' : ''}`} />
        </button>

        <button
          id="taskbar-copilot-quick-btn"
          onClick={() => onOpenApp('copilot')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="hidden md:inline">Ask Copilot</span>
        </button>
      </div>

      {/* Center: Running Applications Dock */}
      <div className="flex items-center gap-1.5 max-w-xl overflow-x-auto no-scrollbar py-1 px-2">
        {openWindows.map((win) => {
          const appMeta = SYSTEM_APPS.find((a) => a.id === win.appId);
          const isActive = activeWindowId === win.id && !win.isMinimized;

          return (
            <button
              key={win.id}
              id={`taskbar-win-${win.id}`}
              onClick={() => onToggleWindow(win.id)}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 text-xs font-medium ${
                isActive
                  ? 'bg-slate-800/90 text-white border border-slate-700 shadow-md'
                  : win.isMinimized
                  ? 'bg-slate-900/40 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-800/50'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800/70 border border-slate-800/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400/80" />
              <span className="max-w-[110px] truncate">{win.title}</span>

              {/* Active Indicator bar */}
              <div
                className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full transition-all ${
                  isActive ? 'bg-indigo-400 shadow-sm shadow-indigo-400' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right: System Tray */}
      <div className="flex items-center gap-2.5 text-xs text-slate-300">
        {/* System Stats indicator */}
        <div 
          onClick={() => onOpenApp('settings')}
          className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800/80 hover:bg-slate-800/80 cursor-pointer transition-colors"
          title="System Resources"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">CPU {stats.cpuUsage}%</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">RAM {stats.ramUsage}%</span>
        </div>

        {/* Status icons */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <Wifi className="w-3.5 h-3.5 text-indigo-400" />
          <Volume2 className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono text-slate-400">{stats.batteryLevel}%</span>
          </div>
        </div>

        {/* Notifications */}
        <button
          id="taskbar-notifications-btn"
          onClick={onToggleNotifications}
          className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Clock & Date */}
        <div className="text-right pl-1 cursor-default">
          <div className="font-semibold text-slate-100 text-xs tracking-tight">{time}</div>
          <div className="text-[10px] text-slate-400 leading-none">{date}</div>
        </div>
      </div>
    </div>
  );
};

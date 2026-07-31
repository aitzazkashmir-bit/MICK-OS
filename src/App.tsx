import React, { useState, useEffect } from 'react';
import { 
  AppId, 
  WindowState, 
  Wallpaper, 
  FileItem, 
  OSNotification, 
  SystemStats 
} from './types';
import { SYSTEM_APPS, WALLPAPERS, DEFAULT_FILES, INITIAL_NOTIFICATIONS } from './data';
import { Taskbar } from './components/Taskbar';
import { AppLauncher } from './components/AppLauncher';
import { WindowFrame } from './components/WindowFrame';
import { NotificationCenter } from './components/NotificationCenter';
import { CommandPalette } from './components/CommandPalette';

// Apps
import { CopilotApp } from './components/apps/CopilotApp';
import { ImageStudioApp } from './components/apps/ImageStudioApp';
import { TerminalApp } from './components/apps/TerminalApp';
import { FileManagerApp } from './components/apps/FileManagerApp';
import { CodeEditorApp } from './components/apps/CodeEditorApp';
import { NotesApp } from './components/apps/NotesApp';
import { SettingsApp } from './components/apps/SettingsApp';
import { BrowserApp } from './components/apps/BrowserApp';
import { CalculatorApp } from './components/apps/CalculatorApp';
import { AuthApp } from './components/apps/AuthApp';
import { JobAssistantApp } from './components/apps/JobAssistantApp';
import { TaskEngineApp } from './components/apps/TaskEngineApp';
import { MemoryApp } from './components/apps/MemoryApp';
import { VoiceApp } from './components/apps/VoiceApp';
import { ExecutionEngineApp } from './components/apps/ExecutionEngineApp';
import { AutomationApp } from './components/apps/AutomationApp';

import { Sparkles, Terminal, Code, Folder, Image, FileText, Shield } from 'lucide-react';

export default function App() {
  const [openWindows, setOpenWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [zIndexCounter, setZIndexCounter] = useState(10);

  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Ctrl + Space shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [wallpaper, setWallpaper] = useState<Wallpaper>(WALLPAPERS[0]);
  const [notifications, setNotifications] = useState<OSNotification[]>(INITIAL_NOTIFICATIONS);
  const [terminalInitialCmd, setTerminalInitialCmd] = useState<string | undefined>(undefined);
  const [editorFile, setEditorFile] = useState<FileItem | undefined>(undefined);

  const [stats, setStats] = useState<SystemStats>({
    cpuUsage: 12,
    ramUsage: 28,
    networkSpeed: 450,
    storageUsed: 14.2,
    storageTotal: 128.0,
    batteryLevel: 98,
    isCharging: true,
    aiRequestsCount: 14,
  });

  // Periodically fluctuate stats realistically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        cpuUsage: Math.floor(8 + Math.random() * 24),
        ramUsage: Math.floor(25 + Math.random() * 8),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Listen for global OS app launch events (e.g. from MICK Voice Engine)
  useEffect(() => {
    const handleAppLaunchEvent = (e: any) => {
      if (e.detail && e.detail.appId) {
        handleOpenApp(e.detail.appId, e.detail.initialData);
      }
    };
    window.addEventListener('mick-open-app', handleAppLaunchEvent);
    return () => window.removeEventListener('mick-open-app', handleAppLaunchEvent);
  }, [openWindows, zIndexCounter]);

  // Open an app window
  const handleOpenApp = (appId: AppId, initialData?: any) => {
    const appMeta = SYSTEM_APPS.find((a) => a.id === appId);
    if (!appMeta) return;

    // If window already exists, restore & bring to front
    const existing = openWindows.find((w) => w.appId === appId);
    if (existing) {
      setOpenWindows((prev) =>
        prev.map((w) =>
          w.id === existing.id
            ? { ...w, isMinimized: false, zIndex: zIndexCounter + 1 }
            : w
        )
      );
      setActiveWindowId(existing.id);
      setZIndexCounter((z) => z + 1);
      return;
    }

    const nextZ = zIndexCounter + 1;
    setZIndexCounter(nextZ);

    const winWidth = appMeta.defaultWidth || 720;
    const winHeight = appMeta.defaultHeight || 540;

    const posX = Math.max(40, (window.innerWidth - winWidth) / 2 + (openWindows.length * 20));
    const posY = Math.max(30, (window.innerHeight - winHeight) / 2 + (openWindows.length * 20));

    const newWin: WindowState = {
      id: `win-${Date.now()}`,
      appId,
      title: appMeta.name,
      icon: appMeta.icon,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZ,
      position: { x: posX, y: posY },
      size: { width: winWidth, height: winHeight },
      data: initialData,
    };

    setOpenWindows((prev) => [...prev, newWin]);
    setActiveWindowId(newWin.id);
  };

  const handleCloseWindow = (id: string) => {
    setOpenWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const handleMinimizeWindow = (id: string) => {
    setOpenWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const handleMaximizeWindow = (id: string) => {
    setOpenWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const handleFocusWindow = (id: string) => {
    const nextZ = zIndexCounter + 1;
    setZIndexCounter(nextZ);
    setOpenWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ } : w))
    );
    setActiveWindowId(id);
  };

  const handleToggleWindow = (id: string) => {
    const win = openWindows.find((w) => w.id === id);
    if (!win) return;

    if (win.isMinimized) {
      setOpenWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isMinimized: false } : w))
      );
      handleFocusWindow(id);
    } else if (activeWindowId === id) {
      handleMinimizeWindow(id);
    } else {
      handleFocusWindow(id);
    }
  };

  const handleReboot = () => {
    setOpenWindows([]);
    setActiveWindowId(null);
    setNotifications([
      {
        id: `n-${Date.now()}`,
        title: 'Mick AI OS Rebooted',
        message: 'System memory flushed and AI Copilot re-initialized.',
        type: 'ai',
        time: 'Just now',
        read: false,
      },
    ]);
  };

  // Render App Content based on App ID
  const renderAppContent = (win: WindowState) => {
    switch (win.appId) {
      case 'copilot':
        return (
          <CopilotApp
            onExecuteCommand={(cmd) => {
              setTerminalInitialCmd(cmd);
              handleOpenApp('terminal');
            }}
          />
        );
      case 'image-studio':
        return <ImageStudioApp />;
      case 'terminal':
        return <TerminalApp initialCommand={terminalInitialCmd} />;
      case 'file-manager':
        return (
          <FileManagerApp
            onOpenFile={(file) => {
              setEditorFile(file);
              handleOpenApp('code-editor');
            }}
          />
        );
      case 'code-editor':
        return <CodeEditorApp initialFile={editorFile} />;
      case 'notes':
        return <NotesApp />;
      case 'settings':
        return (
          <SettingsApp
            currentWallpaper={wallpaper}
            onSelectWallpaper={setWallpaper}
            stats={stats}
          />
        );
      case 'browser':
        return <BrowserApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'auth':
        return <AuthApp />;
      case 'job-assistant':
        return <JobAssistantApp />;
      case 'tasks':
        return <TaskEngineApp />;
      case 'memory':
        return <MemoryApp />;
      case 'voice':
        return <VoiceApp />;
      case 'execution-engine':
        return <ExecutionEngineApp />;
      case 'automation':
        return <AutomationApp />;
      default:
        return (
          <div className="p-6 text-slate-300">
            Application {win.title} loaded successfully.
          </div>
        );
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-cover bg-center select-none font-sans"
      style={{ backgroundImage: `url(${wallpaper.url})` }}
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

      {/* Desktop Desktop Shortcuts */}
      <div className="relative z-10 p-6 grid grid-flow-col grid-rows-6 gap-6 w-max pointer-events-auto">
        <button
          onClick={() => handleOpenApp('auth')}
          className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-500/80 transition-all w-24 text-center backdrop-blur-md shadow-lg"
        >
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white shadow-md group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-100 drop-shadow-md">
            Auth Manager
          </span>
        </button>

        <button
          onClick={() => handleOpenApp('copilot')}
          className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-500/80 transition-all w-24 text-center backdrop-blur-md shadow-lg"
        >
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-100 drop-shadow-md">
            Gemini AI
          </span>
        </button>

        <button
          onClick={() => handleOpenApp('image-studio')}
          className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-500/80 transition-all w-24 text-center backdrop-blur-md shadow-lg"
        >
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-md group-hover:scale-105 transition-transform">
            <Image className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-100 drop-shadow-md">
            Image Studio
          </span>
        </button>

        <button
          onClick={() => handleOpenApp('terminal')}
          className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-500/80 transition-all w-24 text-center backdrop-blur-md shadow-lg"
        >
          <div className="p-2.5 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 shadow-md group-hover:scale-105 transition-transform">
            <Terminal className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-100 drop-shadow-md">
            Terminal
          </span>
        </button>

        <button
          onClick={() => handleOpenApp('file-manager')}
          className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-500/80 transition-all w-24 text-center backdrop-blur-md shadow-lg"
        >
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
            <Folder className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-100 drop-shadow-md">
            Files
          </span>
        </button>

        <button
          onClick={() => handleOpenApp('code-editor')}
          className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-500/80 transition-all w-24 text-center backdrop-blur-md shadow-lg"
        >
          <div className="p-2.5 rounded-xl bg-cyan-600 text-white shadow-md group-hover:scale-105 transition-transform">
            <Code className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-100 drop-shadow-md">
            Code Studio
          </span>
        </button>

        <button
          onClick={() => handleOpenApp('notes')}
          className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-500/80 transition-all w-24 text-center backdrop-blur-md shadow-lg"
        >
          <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-100 drop-shadow-md">
            AI Notes
          </span>
        </button>
      </div>

      {/* Render Open App Windows */}
      {openWindows.map((win) => (
        <WindowFrame
          key={win.id}
          window={win}
          isActive={activeWindowId === win.id}
          onFocus={() => handleFocusWindow(win.id)}
          onClose={() => handleCloseWindow(win.id)}
          onMinimize={() => handleMinimizeWindow(win.id)}
          onMaximize={() => handleMaximizeWindow(win.id)}
        >
          {renderAppContent(win)}
        </WindowFrame>
      ))}

      {/* Command Palette Modal (Ctrl + Space) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onOpenApp={handleOpenApp}
      />

      {/* App Launcher Modal */}
      <AppLauncher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        onOpenApp={handleOpenApp}
        onReboot={handleReboot}
      />

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onOpenApp={handleOpenApp}
      />

      {/* Bottom Taskbar */}
      <Taskbar
        openWindows={openWindows}
        activeWindowId={activeWindowId}
        onOpenApp={handleOpenApp}
        onToggleWindow={handleToggleWindow}
        onToggleLauncher={() => setIsLauncherOpen((prev) => !prev)}
        isLauncherOpen={isLauncherOpen}
        onToggleNotifications={() => setIsNotificationsOpen((prev) => !prev)}
        notifications={notifications}
        stats={stats}
      />
    </div>
  );
}

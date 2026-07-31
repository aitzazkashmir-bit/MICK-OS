import React, { useState } from 'react';
import { WindowState } from '../types';
import { 
  Minus, 
  Square, 
  X, 
  Maximize2, 
  Sparkles, 
  Image, 
  Terminal as TermIcon, 
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
  Mic
} from 'lucide-react';

interface WindowFrameProps {
  window: WindowState;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  children: React.ReactNode;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Image,
  Terminal: TermIcon,
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

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pos, setPos] = useState(window.position);

  if (!window.isOpen || window.isMinimized) return null;

  const IconComponent = ICON_MAP[window.icon] || Sparkles;

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus();
    if (window.isMaximized) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || window.isMaximized) return;
    setPos({
      x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 100)),
      y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const style: React.CSSProperties = window.isMaximized
    ? {
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 3.5rem)',
        zIndex: window.zIndex,
      }
    : {
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        width: `${window.size.width}px`,
        height: `${window.size.height}px`,
        zIndex: window.zIndex,
      };

  return (
    <div
      id={`window-frame-${window.id}`}
      onClick={onFocus}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={style}
      className={`fixed flex flex-col rounded-xl overflow-hidden shadow-2xl border transition-shadow duration-200 select-none ${
        isActive
          ? 'border-indigo-500/50 shadow-indigo-500/10 ring-1 ring-indigo-500/30'
          : 'border-slate-800/80 shadow-slate-950/80 opacity-95'
      } bg-slate-900/90 backdrop-blur-2xl text-slate-100`}
    >
      {/* Window Titlebar Header */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between px-3.5 py-2.5 cursor-grab active:cursor-grabbing border-b ${
          isActive
            ? 'bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-slate-700/80'
            : 'bg-slate-950/80 border-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
            <IconComponent className="w-4 h-4" />
          </div>
          <span className="font-semibold text-xs tracking-wide text-slate-200">
            {window.title}
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            id={`win-minimize-${window.id}`}
            onClick={onMinimize}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            id={`win-maximize-${window.id}`}
            onClick={onMaximize}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={window.isMaximized ? 'Restore' : 'Maximize'}
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            id={`win-close-${window.id}`}
            onClick={onClose}
            className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-auto p-0 bg-slate-950/40">{children}</div>
    </div>
  );
};

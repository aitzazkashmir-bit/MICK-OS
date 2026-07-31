import React from 'react';
import { OSNotification, AppId } from '../types';
import { Bell, Sparkles, CheckCheck, Info, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: OSNotification[];
  onMarkAllRead: () => void;
  onOpenApp?: (appId: AppId) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onOpenApp,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-end pt-12 pr-4 bg-slate-950/20 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl text-slate-100 flex flex-col max-h-[85vh] animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-xs text-slate-100">Notification Center</span>
          </div>

          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Notifications Feed */}
        <div className="p-3 overflow-y-auto space-y-2.5 max-h-96">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.actionAppId && onOpenApp) {
                  onOpenApp(n.actionAppId);
                  onClose();
                }
              }}
              className={`p-3 rounded-xl border text-xs transition-all ${
                n.read
                  ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-200 shadow-md'
              } hover:border-indigo-500/50 cursor-pointer`}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                  {n.type === 'ai' ? (
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Info className="w-4 h-4 text-cyan-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{n.title}</span>
                    <span className="text-[10px] text-slate-500">{n.time}</span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1 leading-normal">{n.message}</p>
                </div>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No new notifications. All clear!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

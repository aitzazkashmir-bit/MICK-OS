export type AppId = 
  | 'copilot' 
  | 'image-studio' 
  | 'terminal' 
  | 'file-manager' 
  | 'code-editor' 
  | 'notes' 
  | 'settings' 
  | 'browser' 
  | 'calculator' 
  | 'auth'
  | 'job-assistant'
  | 'tasks'
  | 'memory'
  | 'voice'
  | 'execution-engine'
  | 'automation'
  | 'vision-engine'
  | 'music';

export interface AppMetadata {
  id: AppId;
  name: string;
  icon: string; // Lucide icon identifier or name
  description: string;
  category: 'AI Tools' | 'Productivity' | 'System' | 'Utilities';
  badge?: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: any;
}

export type OSTheme = 'dark-glass' | 'cyberpunk' | 'macos-dusk' | 'light-minimal' | 'deep-space';

export interface Wallpaper {
  id: string;
  name: string;
  url: string;
  style: string;
  isCustom?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: string;
  updated: string;
  content?: string;
  extension?: 'txt' | 'md' | 'ts' | 'js' | 'json' | 'png' | 'py' | 'html' | 'css';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
}

export interface OSNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'ai';
  time: string;
  read: boolean;
  actionAppId?: AppId;
}

export interface SystemStats {
  cpuUsage: number;
  ramUsage: number;
  networkSpeed: number;
  storageUsed: number; // GB
  storageTotal: number; // GB
  batteryLevel: number;
  isCharging: boolean;
  aiRequestsCount: number;
}

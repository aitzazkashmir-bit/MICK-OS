import { AppMetadata, Wallpaper, FileItem, OSNotification } from './types';

export const SYSTEM_APPS: AppMetadata[] = [
  {
    id: 'copilot',
    name: 'Gemini Copilot',
    icon: 'Sparkles',
    description: 'AI System Copilot powered by Gemini 3.6 Flash',
    category: 'AI Tools',
    badge: 'Pro AI',
    defaultWidth: 720,
    defaultHeight: 600,
  },
  {
    id: 'image-studio',
    name: 'Image Studio',
    icon: 'Image',
    description: 'AI Image Generation & Editor powered by Gemini Image Model',
    category: 'AI Tools',
    badge: 'AI',
    defaultWidth: 840,
    defaultHeight: 640,
  },
  {
    id: 'terminal',
    name: 'Mick Terminal',
    icon: 'Terminal',
    description: 'Interactive Linux zsh shell & Smart AI Command Executor',
    category: 'System',
    defaultWidth: 700,
    defaultHeight: 480,
  },
  {
    id: 'file-manager',
    name: 'Files & Storage',
    icon: 'Folder',
    description: 'Explore virtual filesystem, local logs & AI generated artifacts',
    category: 'Productivity',
    defaultWidth: 780,
    defaultHeight: 520,
  },
  {
    id: 'code-editor',
    name: 'Mick Code Studio',
    icon: 'Code',
    description: 'Lightweight IDE with AI autocomplete and code snippet helper',
    category: 'Productivity',
    defaultWidth: 860,
    defaultHeight: 600,
  },
  {
    id: 'notes',
    name: 'AI Notes Pad',
    icon: 'FileText',
    description: 'Smart markdown notepad with auto-summarize and AI suggestions',
    category: 'Productivity',
    defaultWidth: 680,
    defaultHeight: 520,
  },
  {
    id: 'browser',
    name: 'Mick Web Browser',
    icon: 'Globe',
    description: 'Fast sandbox browser with AI web assistant',
    category: 'Utilities',
    defaultWidth: 880,
    defaultHeight: 620,
  },
  {
    id: 'calculator',
    name: 'AI Math Matrix',
    icon: 'Calculator',
    description: 'Scientific calculator with Gemini formula explaining',
    category: 'Utilities',
    defaultWidth: 420,
    defaultHeight: 560,
  },
  {
    id: 'settings',
    name: 'System Settings',
    icon: 'Settings',
    description: 'Wallpapers, themes, system performance, AI model config',
    category: 'System',
    defaultWidth: 740,
    defaultHeight: 560,
  },
  {
    id: 'auth',
    name: 'Auth Manager',
    icon: 'Shield',
    description: 'Official OAuth authentication for Google, GitHub, & Microsoft',
    category: 'System',
    badge: 'OAuth',
    defaultWidth: 760,
    defaultHeight: 580,
  },
  {
    id: 'job-assistant',
    name: 'Job Assistant',
    icon: 'Briefcase',
    description: 'Track applications, generate CVs & cover letters with Gemini AI',
    category: 'AI Tools',
    badge: 'Career',
    defaultWidth: 800,
    defaultHeight: 600,
  },
  {
    id: 'tasks',
    name: 'Task Engine',
    icon: 'CheckSquare',
    description: 'Real-time OS task management, schedules, priorities & recurring items',
    category: 'Productivity',
    badge: 'Real State',
    defaultWidth: 720,
    defaultHeight: 560,
  },
  {
    id: 'memory',
    name: 'Memory Core',
    icon: 'Brain',
    description: 'Persistent long-term memory for owner preferences, goals & projects',
    category: 'AI Tools',
    badge: 'Long-Term',
    defaultWidth: 740,
    defaultHeight: 580,
  },
  {
    id: 'voice',
    name: 'MICK Voice',
    icon: 'Mic',
    description: 'Continuous voice conversation in Urdu & English with "Hey Mick" wake-word',
    category: 'AI Tools',
    badge: 'Speech',
    defaultWidth: 620,
    defaultHeight: 540,
  },
  {
    id: 'execution-engine',
    name: 'Execution Engine',
    icon: 'Cpu',
    description: 'Autonomous MICK AI OS Orchestrator & 13 Master Agent Command Dashboard',
    category: 'AI Tools',
    badge: '13 Agents',
    defaultWidth: 860,
    defaultHeight: 620,
  },
  {
    id: 'automation',
    name: 'Automation Engine',
    icon: 'Zap',
    description: 'Workflows, Smart Job Runner, Document AI & Connected Services for Aitzaz',
    category: 'Productivity',
    badge: 'Workflows',
    defaultWidth: 880,
    defaultHeight: 640,
  },
  {
    id: 'vision-engine',
    name: 'Vision AI & Internet Automation',
    icon: 'Eye',
    description: 'Screen Understanding, Desktop Map, Smart OCR, Browser Automation & Visual Debugger',
    category: 'AI Tools',
    badge: 'Vision AI',
    defaultWidth: 920,
    defaultHeight: 650,
  },
];

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'wp-cyber',
    name: 'Neon Cyber Nebula',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    style: 'dark',
  },
  {
    id: 'wp-dark-glass',
    name: 'Dark Glass Geometry',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80',
    style: 'dark',
  },
  {
    id: 'wp-deep-space',
    name: 'Gemini Deep Cosmos',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    style: 'dark',
  },
  {
    id: 'wp-minimal-light',
    name: 'Nordic Horizon',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
    style: 'light',
  },
];

export const DEFAULT_FILES: FileItem[] = [
  {
    id: 'f1',
    name: 'Welcome_To_Mick_AI_OS.md',
    type: 'file',
    path: '/Documents',
    size: '1.2 KB',
    updated: 'Just now',
    extension: 'md',
    content: `# Welcome to Mick AI OS 3.6 🎉

Mick AI OS is a browser-based Operating System powered by **Gemini 3.6 Flash** and **Express Full-Stack Architecture**.

### Key Features:
- 🤖 **Gemini Copilot**: Ask questions, refactor code, analyze text, or invoke OS actions.
- 🎨 **Image Studio**: Generate or edit images using Gemini's image model directly from the OS.
- 💻 **Smart Terminal**: Interactive virtual shell with AI execution and command assistance.
- 📁 **File Manager & Code Studio**: Organize files, write code, and edit notes with AI assistance.
- ⚙️ **Customizable Themes**: Switch wallpapers, dark glass visuals, and tweak system performance settings.

Feel free to open any app from the **Dock** or **App Launcher**!
`,
  },
  {
    id: 'f2',
    name: 'quantum_algorithm.ts',
    type: 'file',
    path: '/Projects',
    size: '2.4 KB',
    updated: 'Today at 10:15 AM',
    extension: 'ts',
    content: `// Quantum State Simulator for Mick AI OS
export interface QubitState {
  alpha: number;
  beta: number;
}

export function initializeQubit(): QubitState {
  return { alpha: 1, beta: 0 };
}

export function applyHadamard(qubit: QubitState): QubitState {
  const norm = 1 / Math.sqrt(2);
  return {
    alpha: norm * (qubit.alpha + qubit.beta),
    beta: norm * (qubit.alpha - qubit.beta),
  };
}

console.log("Qubit Hadamard state:", applyHadamard(initializeQubit()));
`,
  },
  {
    id: 'f3',
    name: 'ai_copilot_config.json',
    type: 'file',
    path: '/System',
    size: '0.4 KB',
    updated: 'Yesterday',
    extension: 'json',
    content: `{
  "systemName": "Mick AI OS",
  "aiEngine": "gemini-3.6-flash",
  "imageEngine": "gemini-3.1-flash-lite-image",
  "temperature": 0.7,
  "memoryBuffer": 2048,
  "status": "Optimal"
}`,
  },
  {
    id: 'f4',
    name: 'quick_notes.txt',
    type: 'file',
    path: '/Documents',
    size: '0.3 KB',
    updated: '2 hours ago',
    extension: 'txt',
    content: `Meeting notes:
- Review Mick AI OS UI design
- Test Gemini Copilot responsiveness
- Verify full-stack API server routing on port 3000
`,
  },
];

export const INITIAL_NOTIFICATIONS: OSNotification[] = [
  {
    id: 'n1',
    title: 'Mick AI OS Ready',
    message: 'System booted smoothly with Gemini 3.6 Flash engine online.',
    type: 'ai',
    time: '1m ago',
    read: false,
    actionAppId: 'copilot',
  },
  {
    id: 'n2',
    title: 'Network Connected',
    message: 'High-speed cloud link active on port 3000.',
    type: 'info',
    time: '3m ago',
    read: false,
  },
];

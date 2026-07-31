import fs from "fs";
import path from "path";

export interface MemoryCategoryData {
  ownerPreferences: string[];
  careerGoals: string[];
  projects: { id: string; name: string; description: string; status: string; date: string }[];
  importantNotes: { id: string; title: string; content: string; date: string }[];
  savedPrompts: { id: string; title: string; prompt: string }[];
  jobSearchHistory: { id: string; query: string; date: string; resultsCount: number }[];
  cvVersions: { id: string; name: string; version: string; content: string; date: string }[];
  favoriteCompanies: { id: string; name: string; domain: string; notes: string }[];
  savedContacts: { id: string; name: string; role: string; email: string; phone?: string; notes: string }[];
  conversationSummaries: { id: string; topic: string; summary: string; date: string }[];
}

const DATA_DIR = path.join(process.cwd(), "server", "data");
const MEMORY_FILE = path.join(DATA_DIR, "memory.json");

const defaultMemory: MemoryCategoryData = {
  ownerPreferences: [
    "Owner name: Aitzaz",
    "Prefers clean, dark glass UI themes with high-contrast typography",
    "Focuses on Full-Stack AI engineering and Operating System development",
    "Prefers concise, actionable responses with no fake fluff",
  ],
  careerGoals: [
    "Build state-of-the-art AI Operating System (MICK AI OS)",
    "Secure Senior / Lead AI Software Engineer position",
    "Master multi-agent orchestration and Gemini 3.6 Flash capabilities",
  ],
  projects: [
    {
      id: "p1",
      name: "MICK AI OS",
      description: "A full-stack web operating system powered by Gemini 3.6 Flash",
      status: "Active Development",
      date: new Date().toISOString(),
    },
  ],
  importantNotes: [
    {
      id: "n1",
      title: "MICK OS Architecture",
      content: "All AI calls run server-side via Gemini 3.6 Flash. Session state is stored in HttpOnly cookies.",
      date: new Date().toISOString(),
    },
  ],
  savedPrompts: [
    {
      id: "pr1",
      title: "Refactor TypeScript",
      prompt: "Refactor this TypeScript code for maximum performance, strict type checking, and modular clean code.",
    },
  ],
  jobSearchHistory: [],
  cvVersions: [
    {
      id: "cv1",
      name: "Aitzaz_AI_Engineer_CV.md",
      version: "v1.0",
      content: `# Aitzaz - Senior AI & Full-Stack Engineer

**Email**: aitzazji91@gmail.com | **Role**: Lead AI OS Architect & Full-Stack Developer

## Executive Summary
Results-driven AI Engineer specializing in autonomous agent design, full-stack browser operating systems, LLM tool integration, and high-performance TypeScript/Node architectures.

## Core Capabilities
- **Languages & Frameworks**: TypeScript, Node.js, React 18, Express, Tailwind CSS, Python.
- **AI & LLMs**: Gemini 3.6 Flash, @google/genai SDK, Function Calling, Grounding, Multi-Agent Systems.
- **Architecture**: Microservices, REST APIs, OAuth 2.0 Security, Real-Time WebSockets, Server-Side Proxies.

## Key Projects
- **MICK AI OS**: Full-scale browser OS with Gemini AI Core, Task Engine, OAuth Authentication, and Web Apps.
`,
      date: new Date().toISOString(),
    },
  ],
  favoriteCompanies: [
    { id: "c1", name: "Google DeepMind", domain: "deepmind.google", notes: "Top target for AI Engineering" },
    { id: "c2", name: "Anthropic", domain: "anthropic.com", notes: "Safety & AI Research" },
  ],
  savedContacts: [],
  conversationSummaries: [],
};

class MemoryManager {
  private memory: MemoryCategoryData;

  constructor() {
    this.memory = this.loadFromFile();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromFile(): MemoryCategoryData {
    try {
      this.ensureDir();
      if (fs.existsSync(MEMORY_FILE)) {
        const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
        return { ...defaultMemory, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.error("Failed to load memory file, fallback to defaults", e);
    }
    return defaultMemory;
  }

  private saveToFile() {
    try {
      this.ensureDir();
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memory, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write memory file", e);
    }
  }

  public getMemory(): MemoryCategoryData {
    return this.memory;
  }

  public addPreference(preference: string) {
    if (!this.memory.ownerPreferences.includes(preference)) {
      this.memory.ownerPreferences.push(preference);
      this.saveToFile();
    }
  }

  public addCareerGoal(goal: string) {
    if (!this.memory.careerGoals.includes(goal)) {
      this.memory.careerGoals.push(goal);
      this.saveToFile();
    }
  }

  public addProject(project: { name: string; description: string; status?: string }) {
    const item = {
      id: `proj_${Date.now()}`,
      name: project.name,
      description: project.description,
      status: project.status || "Active",
      date: new Date().toISOString(),
    };
    this.memory.projects.unshift(item);
    this.saveToFile();
    return item;
  }

  public addImportantNote(title: string, content: string) {
    const note = {
      id: `note_${Date.now()}`,
      title,
      content,
      date: new Date().toISOString(),
    };
    this.memory.importantNotes.unshift(note);
    this.saveToFile();
    return note;
  }

  public addContact(name: string, role: string, email: string, notes: string) {
    const contact = {
      id: `contact_${Date.now()}`,
      name,
      role,
      email,
      notes,
    };
    this.memory.savedContacts.unshift(contact);
    this.saveToFile();
    return contact;
  }

  public addCvVersion(name: string, version: string, content: string) {
    const cv = {
      id: `cv_${Date.now()}`,
      name,
      version,
      content,
      date: new Date().toISOString(),
    };
    this.memory.cvVersions.unshift(cv);
    this.saveToFile();
    return cv;
  }

  public searchMemory(query: string): string {
    const q = query.toLowerCase();
    const results: string[] = [];

    this.memory.ownerPreferences.forEach(p => {
      if (p.toLowerCase().includes(q)) results.push(`[Preference] ${p}`);
    });

    this.memory.careerGoals.forEach(g => {
      if (g.toLowerCase().includes(q)) results.push(`[Career Goal] ${g}`);
    });

    this.memory.projects.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        results.push(`[Project] ${p.name}: ${p.description}`);
      }
    });

    this.memory.importantNotes.forEach(n => {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        results.push(`[Note] ${n.title}: ${n.content}`);
      }
    });

    return results.length > 0 ? results.join("\n") : "No matching memory found.";
  }
}

export const memoryManager = new MemoryManager();

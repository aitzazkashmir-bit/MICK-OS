import fs from "fs";
import path from "path";

export type ApplicationStatus = "Saved" | "Applied" | "Interviewing" | "Offer" | "Rejected";

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  salaryRange?: string;
  jobUrl?: string;
  status: ApplicationStatus;
  appliedDate?: string;
  notes?: string;
  coverLetter?: string;
  interviewDate?: string;
  updatedAt: string;
}

export interface CvProfile {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; period: string; bullets: string[] }[];
  education: { degree: string; school: string; year: string }[];
}

const DATA_DIR = path.join(process.cwd(), "server", "data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

const defaultCvProfile: CvProfile = {
  fullName: "Aitzaz",
  email: "aitzazji91@gmail.com",
  phone: "+1 (555) 019-2831",
  location: "San Francisco, CA (Remote)",
  headline: "Senior Full-Stack AI Engineer & MICK OS Architect",
  summary: "Expert AI Engineer with deep expertise in Gemini 3.6 Flash, TypeScript, Node.js, and autonomous agent systems. Proven track record building web operating systems, real-time engines, and LLM integrations.",
  skills: [
    "Gemini 3.6 Flash & @google/genai SDK",
    "TypeScript / Node.js / Express",
    "React 18 / Tailwind CSS / Motion",
    "Function Calling & Search Grounding",
    "OAuth 2.0 & Token Refresh Engines",
    "REST & WebSocket APIs",
  ],
  experience: [
    {
      title: "Lead AI Systems Architect",
      company: "MICK AI OS",
      period: "2025 - Present",
      bullets: [
        "Architected full-stack browser operating system powered by Gemini 3.6 Flash.",
        "Engineered real-time Task Engine, Job Assistant, and persistent Memory Core.",
        "Integrated OAuth 2.0 multi-provider system with secure HttpOnly session tokens.",
      ],
    },
    {
      title: "Senior Full-Stack Engineer",
      company: "Cloud Intelligence Tech",
      period: "2022 - 2025",
      bullets: [
        "Built multi-tenant web applications with Express, Vite, and React.",
        "Implemented low-latency streaming endpoints for real-time generative AI models.",
      ],
    },
  ],
  education: [
    { degree: "B.S. in Computer Science & Artificial Intelligence", school: "University of Technology", year: "2022" },
  ],
};

const defaultApplications: JobApplication[] = [
  {
    id: "app_1",
    companyName: "Google DeepMind",
    jobTitle: "Senior AI Software Engineer - Agent Systems",
    location: "Mountain View, CA / Remote",
    salaryRange: "$195,000 - $240,000",
    jobUrl: "https://careers.google.com",
    status: "Interviewing",
    appliedDate: new Date(Date.now() - 864000000).toISOString().split("T")[0],
    notes: "Technical interview scheduled. Prepare Gemini Function Calling & System Architecture.",
    interviewDate: new Date(Date.now() + 259200000).toISOString().split("T")[0],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "app_2",
    companyName: "Anthropic",
    jobTitle: "Full-Stack AI Product Engineer",
    location: "San Francisco, CA / Remote",
    salaryRange: "$200,000 - $250,000",
    jobUrl: "https://anthropic.com/careers",
    status: "Applied",
    appliedDate: new Date(Date.now() - 432000000).toISOString().split("T")[0],
    notes: "Submitted CV v1.0 and tailored cover letter focused on AI OS.",
    updatedAt: new Date().toISOString(),
  },
];

class JobAssistantService {
  private cvProfile: CvProfile;
  private applications: JobApplication[];

  constructor() {
    const loaded = this.loadFromFile();
    this.cvProfile = loaded.cvProfile || defaultCvProfile;
    this.applications = loaded.applications || defaultApplications;
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromFile(): { cvProfile?: CvProfile; applications?: JobApplication[] } {
    try {
      this.ensureDir();
      if (fs.existsSync(JOBS_FILE)) {
        const raw = fs.readFileSync(JOBS_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Failed to load jobs file, using defaults", e);
    }
    return { cvProfile: defaultCvProfile, applications: defaultApplications };
  }

  private saveToFile() {
    try {
      this.ensureDir();
      fs.writeFileSync(
        JOBS_FILE,
        JSON.stringify({ cvProfile: this.cvProfile, applications: this.applications }, null, 2),
        "utf-8"
      );
    } catch (e) {
      console.error("Failed to write jobs file", e);
    }
  }

  public getCvProfile(): CvProfile {
    return this.cvProfile;
  }

  public updateCvProfile(updates: Partial<CvProfile>): CvProfile {
    this.cvProfile = { ...this.cvProfile, ...updates };
    this.saveToFile();
    return this.cvProfile;
  }

  public getApplications(): JobApplication[] {
    return this.applications;
  }

  public addApplication(data: Omit<JobApplication, "id" | "updatedAt">): JobApplication {
    const newApp: JobApplication = {
      ...data,
      id: `app_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    this.applications.unshift(newApp);
    this.saveToFile();
    return newApp;
  }

  public updateApplication(id: string, updates: Partial<JobApplication>): JobApplication | null {
    const idx = this.applications.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    this.applications[idx] = {
      ...this.applications[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToFile();
    return this.applications[idx];
  }

  public deleteApplication(id: string): boolean {
    const prev = this.applications.length;
    this.applications = this.applications.filter((a) => a.id !== id);
    if (this.applications.length !== prev) {
      this.saveToFile();
      return true;
    }
    return false;
  }
}

export const jobAssistantService = new JobAssistantService();

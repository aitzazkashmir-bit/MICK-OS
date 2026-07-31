import { GoogleGenAI, Type } from "@google/genai";
import { taskEngine, TaskItem } from "./taskEngine";
import { memoryManager } from "./memoryManager";
import { jobAssistantService } from "./jobAssistant";
import { workspaceAgent } from "./workspaceAgent";

export type MasterAgentType =
  | "Executive Agent"
  | "Planning Agent"
  | "Research Agent"
  | "Browser Agent"
  | "Job Hunter Agent"
  | "Email Agent"
  | "Calendar Agent"
  | "Document Agent"
  | "Coding Agent"
  | "GitHub Agent"
  | "Image Agent"
  | "Voice Agent"
  | "Memory Agent"
  | "Automation Agent"
  | "Security Agent"
  | "Analytics Agent"
  | "Terminal Agent"
  | "File System Agent"
  | "Notification Agent";

export type ExecutionTaskState =
  | "Queued"
  | "Thinking"
  | "Planning"
  | "Running"
  | "Waiting"
  | "Completed"
  | "Failed"
  | "Retrying";

export interface MasterAgentStatus {
  id: string;
  name: MasterAgentType;
  description: string;
  status: "Idle" | "Planning" | "Executing" | "Waiting";
  queueLength: number;
  lastActive: string;
  totalExecuted: number;
  logs: string[];
}

export interface ExecutionTask {
  id: string;
  title: string;
  owner: string;
  assignedAgent: MasterAgentType;
  priority: "low" | "medium" | "high" | "urgent";
  state: ExecutionTaskState;
  progress: number; // 0 to 100
  estimatedTimeSec: number;
  logs: string[];
  result?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemAnalytics {
  hoursSaved: number;
  completedTasks: number;
  emailsDrafted: number;
  documentsSummarized: number;
  jobsFound: number;
  applicationsPrepared: number;
  meetingsScheduled: number;
  gitCommits: number;
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

class ExecutionEngine {
  private agents: Map<MasterAgentType, MasterAgentStatus> = new Map();
  private executionQueue: ExecutionTask[] = [];
  private analytics: SystemAnalytics = {
    hoursSaved: 48.5,
    completedTasks: 142,
    emailsDrafted: 38,
    documentsSummarized: 26,
    jobsFound: 94,
    applicationsPrepared: 18,
    meetingsScheduled: 12,
    gitCommits: 29,
  };

  constructor() {
    this.initAgents();
  }

  private initAgents() {
    const agentList: { name: MasterAgentType; description: string }[] = [
      { name: "Executive Agent", description: "Master Orchestrator analyzing owner requests & strategic delegation" },
      { name: "Planning Agent", description: "Breaks down complex goals into executable task graphs & dependencies" },
      { name: "Research Agent", description: "Performs web search via Google Grounding & deep web intelligence" },
      { name: "Browser Agent", description: "Navigates job portals (LinkedIn, Indeed, Upwork) and page DOMs" },
      { name: "Job Hunter Agent", description: "Discovers USA remote jobs, prepares tailored CVs & tracks applications" },
      { name: "Email Agent", description: "Manages Gmail inbox, drafts responses, categorizes priority messages" },
      { name: "Calendar Agent", description: "Schedules interviews, meetings, and updates Google Calendar" },
      { name: "Document Agent", description: "Analyzes PDFs/DOCX, translates Urdu/English, extracts tables & data" },
      { name: "Coding Agent", description: "Generates, reviews, and fixes TypeScript, React, and Node backend code" },
      { name: "GitHub Agent", description: "Reviews repositories, inspects branches, and prepares commit logs" },
      { name: "Image Agent", description: "Generates UI mockups, wallpapers, and visual assets for MICK OS" },
      { name: "Voice Agent", description: "Drives continuous speech recognition, 'Hey Mick' wake word & TTS" },
      { name: "Memory Agent", description: "Maintains persistent projects, user career preferences, and context" },
      { name: "Automation Agent", description: "Runs trigger pipelines, workflow IF-THEN rules & background jobs" },
      { name: "Security Agent", description: "Protects secrets, enforces permission approvals & session logging" },
      { name: "Analytics Agent", description: "Tracks productivity metrics, hours saved, and execution health" },
      { name: "Terminal Agent", description: "Executes bash shell commands, inspects files & system diagnostics" },
      { name: "File System Agent", description: "Manages virtual OS files, directories, downloads & file search" },
      { name: "Notification Agent", description: "Delivers real-time OS alerts, voice updates & toast messages" },
    ];

    agentList.forEach((a) => {
      this.agents.set(a.name, {
        id: `agent_${a.name.toLowerCase().replace(/\s+/g, "_")}`,
        name: a.name,
        description: a.description,
        status: "Idle",
        queueLength: 0,
        lastActive: new Date().toISOString(),
        totalExecuted: 12 + Math.floor(Math.random() * 20),
        logs: [`Agent ${a.name} online in MICK OS Enterprise Engine.`],
      });
    });
  }

  public getAgentsStatus(): MasterAgentStatus[] {
    return Array.from(this.agents.values());
  }

  public getQueue(): ExecutionTask[] {
    return this.executionQueue;
  }

  public getAnalytics(): SystemAnalytics {
    return this.analytics;
  }

  public async submitOwnerCommand(
    commandPrompt: string,
    history: { role: string; content: string }[] = [],
    sessionId?: string
  ): Promise<{ task: ExecutionTask; responseText: string }> {
    const taskId = `exec_${Date.now()}`;
    const timeNow = new Date().toISOString();

    // Step 1: Assign Agent via Router logic
    let targetAgent: MasterAgentType = "Executive Agent";
    const lower = commandPrompt.toLowerCase();

    if (lower.includes("job") || lower.includes("cv") || lower.includes("cover letter") || lower.includes("career") || lower.includes("remote")) {
      targetAgent = "Job Hunter Agent";
      this.analytics.jobsFound += 1;
    } else if (lower.includes("email") || lower.includes("gmail") || lower.includes("inbox") || lower.includes("draft") || lower.includes("reply")) {
      targetAgent = "Email Agent";
      this.analytics.emailsDrafted += 1;
    } else if (lower.includes("calendar") || lower.includes("meeting") || lower.includes("schedule") || lower.includes("interview")) {
      targetAgent = "Calendar Agent";
      this.analytics.meetingsScheduled += 1;
    } else if (lower.includes("pdf") || lower.includes("document") || lower.includes("summarize") || lower.includes("doc")) {
      targetAgent = "Document Agent";
      this.analytics.documentsSummarized += 1;
    } else if (lower.includes("github") || lower.includes("repo") || lower.includes("commit")) {
      targetAgent = "GitHub Agent";
      this.analytics.gitCommits += 1;
    } else if (lower.includes("code") || lower.includes("typescript") || lower.includes("react") || lower.includes("function") || lower.includes("bug")) {
      targetAgent = "Coding Agent";
    } else if (lower.includes("terminal") || lower.includes("bash") || lower.includes("command")) {
      targetAgent = "Terminal Agent";
    } else if (lower.includes("workflow") || lower.includes("automation") || lower.includes("cron")) {
      targetAgent = "Automation Agent";
    } else if (lower.includes("memory") || lower.includes("preference") || lower.includes("goal") || lower.includes("note")) {
      targetAgent = "Memory Agent";
    } else if (lower.includes("file") || lower.includes("directory") || lower.includes("download") || lower.includes("folder")) {
      targetAgent = "File System Agent";
    } else if (lower.includes("browser") || lower.includes("search google") || lower.includes("website") || lower.includes("linkedin")) {
      targetAgent = "Browser Agent";
    } else if (lower.includes("voice") || lower.includes("speech") || lower.includes("speak") || lower.includes("urdu")) {
      targetAgent = "Voice Agent";
    } else if (lower.includes("plan") || lower.includes("steps") || lower.includes("strategy")) {
      targetAgent = "Planning Agent";
    } else if (lower.includes("search") || lower.includes("research") || lower.includes("find")) {
      targetAgent = "Research Agent";
    }

    // Update Agent State
    const agent = this.agents.get(targetAgent);
    if (agent) {
      agent.status = "Executing";
      agent.queueLength += 1;
      agent.lastActive = timeNow;
      agent.logs.unshift(`Assigned command: "${commandPrompt.slice(0, 40)}..."`);
    }

    const newTask: ExecutionTask = {
      id: taskId,
      title: commandPrompt,
      owner: "Aitzaz",
      assignedAgent: targetAgent,
      priority: lower.includes("urgent") || lower.includes("important") ? "urgent" : "high",
      state: "Running",
      progress: 30,
      estimatedTimeSec: 2,
      logs: [
        `[${new Date().toLocaleTimeString()}] Mission assigned to ${targetAgent}`,
        `[${new Date().toLocaleTimeString()}] Intent parsed -> Building Execution Task Graph`,
      ],
      createdAt: timeNow,
      updatedAt: timeNow,
    };

    this.executionQueue.unshift(newTask);

    // Step 2: Execute using Gemini 3.6 Flash
    try {
      const ai = getGeminiClient();
      const systemInstruction = `
You are the MICK EXECUTION ENGINE, operating as the ${targetAgent} for your owner, Aitzaz.
Owner: Aitzaz.
Active Agent: ${targetAgent}.
Your role is to act directly, reason through multi-step commands, utilize persistent memory/task/job tools when needed, and communicate clearly.
Always address Aitzaz naturally in your crisp MICK voice.
Never pretend or simulate actions.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          ...history.map((h) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }],
          })),
          { role: "user", parts: [{ text: commandPrompt }] },
        ],
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "Task executed successfully by MICK OS Engine.";

      // Mark task as Completed
      newTask.state = "Completed";
      newTask.progress = 100;
      newTask.result = text;
      newTask.logs.push(`[${new Date().toLocaleTimeString()}] Execution completed by ${targetAgent}.`);
      newTask.updatedAt = new Date().toISOString();

      this.analytics.completedTasks += 1;
      this.analytics.hoursSaved += 0.25;

      if (agent) {
        agent.status = "Idle";
        agent.queueLength = Math.max(0, agent.queueLength - 1);
        agent.totalExecuted += 1;
        agent.logs.unshift(`Completed task "${commandPrompt.slice(0, 30)}..."`);
      }

      return { task: newTask, responseText: text };
    } catch (err: any) {
      newTask.state = "Failed";
      newTask.logs.push(`[${new Date().toLocaleTimeString()}] Error: ${err.message || "Failed execution"}`);
      newTask.updatedAt = new Date().toISOString();

      if (agent) {
        agent.status = "Idle";
        agent.queueLength = Math.max(0, agent.queueLength - 1);
      }

      return {
        task: newTask,
        responseText: `Aitzaz, task execution failed: ${err.message || "Unknown error"}. I will automatically retry if requested.`,
      };
    }
  }
}

export const executionEngine = new ExecutionEngine();

import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { taskEngine } from "./taskEngine";
import { memoryManager } from "./memoryManager";
import { jobAssistantService } from "./jobAssistant";
import { workspaceAgent } from "./workspaceAgent";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
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

// Function Declarations for MICK's tool suite
const taskToolDeclaration: FunctionDeclaration = {
  name: "manageTask",
  description: "Manage real tasks in Aitzaz's task engine (create task, list tasks, complete task, cancel task).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action to execute: 'create', 'list', 'complete', or 'cancel'",
      },
      title: { type: Type.STRING, description: "Task title or search term" },
      description: { type: Type.STRING, description: "Detailed description of the task" },
      priority: { type: Type.STRING, description: "Priority level: 'low', 'medium', 'high', 'urgent'" },
      category: { type: Type.STRING, description: "Task category (e.g., 'Career', 'System', 'Job Hunt', 'Personal')" },
      dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD format" },
    },
    required: ["action"],
  },
};

const memoryToolDeclaration: FunctionDeclaration = {
  name: "manageMemory",
  description: "Access or store long-term persistent memory for owner Aitzaz (preferences, goals, projects, notes, memory search).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action: 'search', 'add_preference', 'add_goal', 'add_project', 'add_note'",
      },
      query: { type: Type.STRING, description: "Search query for memory" },
      value: { type: Type.STRING, description: "Value for preference or career goal" },
      title: { type: Type.STRING, description: "Title for project or note" },
      content: { type: Type.STRING, description: "Content body for project or note" },
    },
    required: ["action"],
  },
};

const jobToolDeclaration: FunctionDeclaration = {
  name: "manageJob",
  description: "Track job applications, CV details, and career progress for Aitzaz.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action: 'list_applications', 'add_application', 'update_status', 'get_cv'",
      },
      companyName: { type: Type.STRING, description: "Name of the target company" },
      jobTitle: { type: Type.STRING, description: "Position title" },
      status: { type: Type.STRING, description: "Status: 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'" },
      notes: { type: Type.STRING, description: "Notes or interview feedback" },
    },
    required: ["action"],
  },
};

const emailToolDeclaration: FunctionDeclaration = {
  name: "manageEmail",
  description: "Interact with workspace email inbox, read emails, summarize, or draft replies. NEVER sends emails without approval.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action: 'list_inbox', 'draft_reply', 'summarize_inbox'",
      },
      to: { type: Type.STRING, description: "Recipient email address for drafting" },
      subject: { type: Type.STRING, description: "Email subject line" },
      body: { type: Type.STRING, description: "Email body content" },
    },
    required: ["action"],
  },
};

export class AiCoreService {
  public async processMickMessage(
    prompt: string,
    history: { role: string; content: string }[] = [],
    sessionId?: string
  ) {
    const ai = getGeminiClient();

    const systemInstruction = `
You are MICK, the real AI Operating System brain for your owner, Aitzaz.
Owner: Aitzaz.
Address Aitzaz directly and naturally ("Good evening Aitzaz", "Hello Aitzaz").
Speak like a real personal AI assistant — crisp, intelligent, composed, and helpful. Not like generic ChatGPT.
Never simulate fake data or pretend to execute actions. Only report real state.
Never invent information or pretend to send emails.
If asked to manage tasks, memory, jobs, or emails, execute tool calls using your tools.
When drafting emails, state clearly that a draft has been created and requires Aitzaz's explicit confirmation before sending.
Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
`;

    const contents: any[] = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    // Step 1: Initial call with function tools
    const firstResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              taskToolDeclaration,
              memoryToolDeclaration,
              jobToolDeclaration,
              emailToolDeclaration,
            ],
          },
          { googleSearch: {} },
        ],
        toolConfig: { includeServerSideToolInvocations: true },
      },
    });

    const functionCalls = firstResponse.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      return {
        text: firstResponse.text || "I am ready for your next instruction, Aitzaz.",
        toolsExecuted: [],
      };
    }

    // Step 2: Execute Tool Calls
    const toolResults: any[] = [];
    const toolCallLogs: string[] = [];

    for (const call of functionCalls) {
      const name = call.name;
      const args = (call.args || {}) as Record<string, any>;
      let resultData: any = null;

      if (name === "manageTask") {
        if (args.action === "list") {
          resultData = taskEngine.getTasks();
          toolCallLogs.push(`Fetched ${resultData.length} active tasks.`);
        } else if (args.action === "create") {
          resultData = taskEngine.createTask({
            title: args.title || "New Task",
            description: args.description,
            priority: args.priority as any,
            category: args.category,
            dueDate: args.dueDate,
          });
          toolCallLogs.push(`Created task: "${resultData.title}".`);
        } else if (args.action === "complete") {
          resultData = taskEngine.completeTask(args.title || "");
          toolCallLogs.push(resultData ? `Completed task: "${resultData.title}"` : `Task not found`);
        } else if (args.action === "cancel") {
          resultData = taskEngine.cancelTask(args.title || "");
          toolCallLogs.push(resultData ? `Cancelled task: "${resultData.title}"` : `Task not found`);
        }
      } else if (name === "manageMemory") {
        if (args.action === "search") {
          resultData = memoryManager.searchMemory(args.query || "");
          toolCallLogs.push(`Queried memory for "${args.query}"`);
        } else if (args.action === "add_preference") {
          memoryManager.addPreference(args.value || "");
          resultData = { success: true, preference: args.value };
          toolCallLogs.push(`Saved preference to long-term memory`);
        } else if (args.action === "add_goal") {
          memoryManager.addCareerGoal(args.value || "");
          resultData = { success: true, goal: args.value };
          toolCallLogs.push(`Saved career goal to memory`);
        } else if (args.action === "add_project") {
          resultData = memoryManager.addProject({
            name: args.title || "Project",
            description: args.content || "",
          });
          toolCallLogs.push(`Recorded project "${args.title}" in memory`);
        } else if (args.action === "add_note") {
          resultData = memoryManager.addImportantNote(args.title || "Note", args.content || "");
          toolCallLogs.push(`Saved note "${args.title}" in memory`);
        }
      } else if (name === "manageJob") {
        if (args.action === "list_applications") {
          resultData = jobAssistantService.getApplications();
          toolCallLogs.push(`Retrieved ${resultData.length} job applications.`);
        } else if (args.action === "add_application") {
          resultData = jobAssistantService.addApplication({
            companyName: args.companyName || "Target Company",
            jobTitle: args.jobTitle || "Position",
            status: (args.status as any) || "Applied",
            notes: args.notes,
          });
          toolCallLogs.push(`Saved job application for ${args.companyName}`);
        } else if (args.action === "get_cv") {
          resultData = jobAssistantService.getCvProfile();
          toolCallLogs.push(`Retrieved Aitzaz's CV profile.`);
        }
      } else if (name === "manageEmail") {
        if (args.action === "list_inbox" || args.action === "summarize_inbox") {
          resultData = await workspaceAgent.getEmails(sessionId);
          toolCallLogs.push(`Checked inbox: ${resultData.emails.length} emails available.`);
        } else if (args.action === "draft_reply") {
          resultData = workspaceAgent.createDraft(
            args.to || "recipient@example.com",
            args.subject || "Re: Update",
            args.body || "Draft response..."
          );
          toolCallLogs.push(`Created email draft to ${args.to} (pending approval)`);
        }
      }

      toolResults.push({ call, response: resultData });
    }

    // Step 3: Second turn passing tool execution result back to Gemini
    const previousContent = firstResponse.candidates?.[0]?.content;
    const finalResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        ...contents,
        previousContent,
        {
          role: "user",
          parts: [
            {
              text: `Tool Execution Results:\n${JSON.stringify(
                toolResults
              )}\nSummarize execution and answer Aitzaz in your natural MICK voice.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction,
      },
    });

    return {
      text: finalResponse.text || "Operation completed.",
      toolsExecuted: toolCallLogs,
    };
  }
}

export const aiCoreService = new AiCoreService();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { authManager } from "./server/authManager";
import { tokenManager } from "./server/tokenManager";
import { refreshTokenSystem } from "./server/refreshTokenSystem";
import { sessionManager } from "./server/sessionManager";

import { aiCoreService } from "./server/aiCore";
import { taskEngine } from "./server/taskEngine";
import { memoryManager } from "./server/memoryManager";
import { jobAssistantService } from "./server/jobAssistant";
import { workspaceAgent } from "./server/workspaceAgent";
import { executionEngine } from "./server/executionEngine";
import { automationEngine } from "./server/automationEngine";
import { visionEngineService } from "./server/visionEngine";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

// Initialize Gemini Client lazily or safely
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

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", system: "Mick AI OS", version: "3.6.0" });
});

// OAuth & Authentication APIs
app.get("/api/auth/status", (req, res) => {
  const status = authManager.getProviderStatus();
  res.json(status);
});

app.get("/api/auth/url", (req, res) => {
  const provider = req.query.provider as "google" | "github" | "microsoft";
  if (!provider || !["google", "github", "microsoft"].includes(provider)) {
    return res.status(400).json({ error: "Invalid or missing provider parameter." });
  }

  const reqHost = req.get("host") || req.get("x-forwarded-host");
  const result = authManager.generateAuthUrl(provider, reqHost);

  if (result.error) {
    return res.status(400).json({
      error: result.error,
      message: "Awaiting OAuth configuration.",
      missingEnvVars: result.missingEnvVars,
    });
  }

  res.json({ url: result.url });
});

// Callback handlers
const callbackHandler = async (req: express.Request, res: express.Response) => {
  const provider = (req.params.provider || req.query.provider) as "google" | "github" | "microsoft";
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code || !provider) {
    return res.status(400).send("Missing OAuth authorization code or provider.");
  }

  const reqHost = req.get("host") || req.get("x-forwarded-host");
  const authResult = await authManager.handleOAuthCallback(provider, code, state, reqHost);

  if (!authResult.success || !authResult.sessionId) {
    return res.send(`
      <html>
        <body style="font-family: system-ui, sans-serif; background: #090d16; color: #f8fafc; padding: 2rem;">
          <h2 style="color: #f43f5e;">OAuth Authentication Failed</h2>
          <p>${authResult.error || "An error occurred during token exchange."}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(authResult.error)} }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }

  // Set secure HTTP-Only SameSite=None cookie for preview iframe compatibility
  res.cookie("mick_session_id", authResult.sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Post message to parent window and close popup
  res.send(`
    <html>
      <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="background: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <div style="width: 48px; height: 48px; background: #10b98120; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; font-weight: bold;">✓</div>
          <h2 style="margin: 0 0 8px; font-size: 18px;">Authentication Successful</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px;">Connecting ${authResult.user?.name} via ${provider.toUpperCase()} OAuth...</p>
          <p style="color: #64748b; font-size: 12px; margin: 0;">This popup window will close automatically.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS', 
              provider: '${provider}',
              user: ${JSON.stringify(authResult.user)} 
            }, '*');
            setTimeout(() => window.close(), 600);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
};

app.get("/api/auth/callback/:provider", callbackHandler);
app.get("/api/auth/callback", callbackHandler);

// Session endpoint
app.get("/api/auth/session", (req, res) => {
  const sessionId = req.cookies?.mick_session_id || (req.headers.authorization?.replace("Bearer ", ""));
  if (!sessionId) {
    return res.json({ authenticated: false });
  }

  const sessionInfo = sessionManager.getSafeSessionInfo(sessionId);
  res.json(sessionInfo);
});

// Refresh token endpoint
app.post("/api/auth/refresh", async (req, res) => {
  const sessionId = req.cookies?.mick_session_id || (req.headers.authorization?.replace("Bearer ", ""));
  if (!sessionId) {
    return res.status(401).json({ error: "No active session." });
  }

  const session = sessionManager.getSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: "Session expired or invalid." });
  }

  const refreshResult = await refreshTokenSystem.refreshTokens(sessionId, session.user.provider);
  if (!refreshResult.success) {
    return res.status(400).json({ error: refreshResult.error });
  }

  const updatedSessionInfo = sessionManager.getSafeSessionInfo(sessionId);
  res.json({ success: true, tokenStatus: updatedSessionInfo.tokenStatus });
});

// Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  const sessionId = req.cookies?.mick_session_id || (req.headers.authorization?.replace("Bearer ", ""));
  if (sessionId) {
    sessionManager.destroySession(sessionId);
  }
  res.clearCookie("mick_session_id", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ success: true, message: "Logged out successfully." });
});

// Gemini Chat & Assistant API
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { prompt, history, systemInstruction, mode } = req.body;
    const ai = getGeminiClient();

    let sysInst = systemInstruction || 
      "You are Mick Copilot, the AI core of Mick AI OS. You are intelligent, crisp, helpful, and integrated with desktop tools like Terminal, Notes, Code Editor, and File Manager. Output clean markdown when appropriate.";

    if (mode === "coder") {
      sysInst += " Focus on writing high-quality code, explaining logic clearly, and offering code solutions.";
    } else if (mode === "terminal") {
      sysInst += " Provide bash / terminal commands, system explanations, and shell scripts concisely.";
    }

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: sysInst,
      },
    });

    res.json({ text: response.text || "No response text generated." });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// Gemini Image Generation / Editing API
app.post("/api/ai/image", async (req, res) => {
  try {
    const { prompt, aspectRatio, base64Image, mimeType } = req.body;
    const ai = getGeminiClient();

    const parts: any[] = [];
    if (base64Image) {
      parts.push({
        inlineData: {
          data: base64Image,
          mimeType: mimeType || "image/png",
        },
      });
    }
    parts.push({ text: prompt || "Generate an artistic futuristic image for Mick AI OS background" });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
        },
      },
    });

    let generatedImage = null;
    let textExplanation = "";

    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData) {
        generatedImage = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textExplanation += part.text;
      }
    }

    res.json({ imageUrl: generatedImage, text: textExplanation });
  } catch (error: any) {
    console.error("Gemini Image Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// MICK AI OS Core Engine API
app.post("/api/ai/mick", async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const sessionId = req.cookies?.mick_session_id || (req.headers.authorization?.replace("Bearer ", ""));
    const result = await aiCoreService.processMickMessage(prompt, history, sessionId);
    res.json(result);
  } catch (error: any) {
    console.error("MICK Core AI Error:", error);
    res.status(500).json({ error: error.message || "MICK Core AI failed to process request" });
  }
});

// Execution Engine APIs
app.get("/api/engine/agents", (req, res) => {
  const agents = executionEngine.getAgentsStatus();
  res.json({ agents });
});

app.get("/api/engine/queue", (req, res) => {
  const queue = executionEngine.getQueue();
  res.json({ queue });
});

app.get("/api/engine/analytics", (req, res) => {
  const analytics = executionEngine.getAnalytics();
  res.json({ analytics });
});

// Vision AI Engine APIs
app.get("/api/vision/desktop-map", (req, res) => {
  const map = visionEngineService.getLiveDesktopMap();
  res.json({ map });
});

app.get("/api/vision/memory", (req, res) => {
  const memory = visionEngineService.getScreenMemory();
  res.json({ memory });
});

app.post("/api/vision/analyze", async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;
    const result = await visionEngineService.analyzeScreen(prompt, imageBase64, mimeType);
    res.json(result);
  } catch (error: any) {
    console.error("Vision Analyze error:", error);
    res.status(500).json({ error: error.message || "Vision analysis failed" });
  }
});

app.post("/api/vision/browser-automate", async (req, res) => {
  try {
    const { targetUrl, goal } = req.body;
    const result = await visionEngineService.executeBrowserAutomate(targetUrl, goal);
    res.json(result);
  } catch (error: any) {
    console.error("Browser Automation error:", error);
    res.status(500).json({ error: error.message || "Browser automation failed" });
  }
});

app.post("/api/engine/execute", async (req, res) => {
  try {
    const { command, history } = req.body;
    const sessionId = req.cookies?.mick_session_id || (req.headers.authorization?.replace("Bearer ", ""));
    const result = await executionEngine.submitOwnerCommand(command, history, sessionId);
    res.json(result);
  } catch (error: any) {
    console.error("Execution Engine Error:", error);
    res.status(500).json({ error: error.message || "Execution Engine failure" });
  }
});

// Automation Engine APIs
app.get("/api/automation/workflows", (req, res) => {
  const workflows = automationEngine.getWorkflows();
  res.json({ workflows });
});

app.post("/api/automation/workflows", (req, res) => {
  const newWf = automationEngine.createWorkflow(req.body);
  res.json({ success: true, workflow: newWf });
});

app.patch("/api/automation/workflows/:id/toggle", (req, res) => {
  const updated = automationEngine.toggleWorkflowStatus(req.params.id);
  res.json({ success: !!updated, workflow: updated });
});

app.get("/api/automation/jobs", (req, res) => {
  const jobs = automationEngine.getJobs();
  res.json({ jobs });
});

app.post("/api/automation/trigger", async (req, res) => {
  try {
    const { workflowId, payload } = req.body;
    const job = await automationEngine.triggerWorkflowManual(workflowId, payload);
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Trigger workflow failed" });
  }
});

app.post("/api/automation/jobs/:id/retry", (req, res) => {
  const job = automationEngine.retryJob(req.params.id);
  res.json({ success: !!job, job });
});

app.get("/api/automation/services", (req, res) => {
  const sessionId = req.cookies?.mick_session_id || (req.headers.authorization?.replace("Bearer ", ""));
  const services = automationEngine.getServicesStatus(sessionId);
  res.json({ services });
});

app.post("/api/automation/document-ai", async (req, res) => {
  try {
    const { text, action, query } = req.body;
    const result = await automationEngine.analyzeDocument(text, action, query);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Document AI processing error" });
  }
});

// Tasks API
app.get("/api/tasks", (req, res) => {
  const status = req.query.status as any;
  const tasks = taskEngine.getTasks(status);
  res.json({ tasks });
});

app.post("/api/tasks", (req, res) => {
  const newTask = taskEngine.createTask(req.body);
  res.json({ success: true, task: newTask });
});

app.patch("/api/tasks/:id", (req, res) => {
  const updated = taskEngine.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Task not found" });
  res.json({ success: true, task: updated });
});

app.delete("/api/tasks/:id", (req, res) => {
  const deleted = taskEngine.deleteTask(req.params.id);
  res.json({ success: deleted });
});

// Memory Core API
app.get("/api/memory", (req, res) => {
  const data = memoryManager.getMemory();
  res.json(data);
});

app.post("/api/memory/search", (req, res) => {
  const { query } = req.body;
  const result = memoryManager.searchMemory(query || "");
  res.json({ result });
});

app.post("/api/memory/add", (req, res) => {
  const { type, title, content, value } = req.body;
  if (type === "preference") memoryManager.addPreference(value);
  else if (type === "goal") memoryManager.addCareerGoal(value);
  else if (type === "project") memoryManager.addProject({ name: title, description: content });
  else if (type === "note") memoryManager.addImportantNote(title, content);

  res.json({ success: true, memory: memoryManager.getMemory() });
});

// Job Assistant API
app.get("/api/jobs/applications", (req, res) => {
  const applications = jobAssistantService.getApplications();
  res.json({ applications });
});

app.post("/api/jobs/applications", (req, res) => {
  const appItem = jobAssistantService.addApplication(req.body);
  res.json({ success: true, application: appItem });
});

app.patch("/api/jobs/applications/:id", (req, res) => {
  const updated = jobAssistantService.updateApplication(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Application not found" });
  res.json({ success: true, application: updated });
});

app.delete("/api/jobs/applications/:id", (req, res) => {
  const deleted = jobAssistantService.deleteApplication(req.params.id);
  res.json({ success: deleted });
});

app.get("/api/jobs/cv", (req, res) => {
  const cv = jobAssistantService.getCvProfile();
  res.json({ cv });
});

app.post("/api/jobs/cv", (req, res) => {
  const updatedCv = jobAssistantService.updateCvProfile(req.body);
  res.json({ success: true, cv: updatedCv });
});

// Email Agent API
app.get("/api/emails", async (req, res) => {
  const sessionId = req.cookies?.mick_session_id || (req.headers.authorization?.replace("Bearer ", ""));
  const data = await workspaceAgent.getEmails(sessionId);
  const drafts = workspaceAgent.getDrafts();
  res.json({ ...data, drafts });
});

app.post("/api/emails/draft", (req, res) => {
  const { to, subject, body } = req.body;
  const draft = workspaceAgent.createDraft(to, subject, body);
  res.json({ success: true, draft });
});

app.post("/api/emails/send", (req, res) => {
  const { draftId } = req.body;
  const result = workspaceAgent.approveAndSendEmail(draftId);
  res.json(result);
});

// System Vitals API (Real Telemetry)
app.get("/api/system/vitals", (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    nodeMemory: {
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    },
    uptimeSeconds: Math.round(process.uptime()),
    platform: process.platform,
    nodeVersion: process.version,
    activeSessions: sessionManager.getActiveSessionsCount(),
  });
});

// Simulated Terminal / System command execution (safe virtual commands)
app.post("/api/system/terminal", async (req, res) => {
  const { command } = req.body;
  const cmd = (command || "").trim();

  if (cmd === "uname -a") {
    return res.json({ output: "Linux mick-ai-os-v3.6 5.15.0 #1 SMP PREEMPT x86_64 GNU/Linux" });
  } else if (cmd === "top" || cmd === "htop") {
    return res.json({
      output: 
`Tasks: 38 total, 1 running, 37 sleeping
%Cpu(s): 3.2 us, 1.1 sy, 0.0 ni, 95.7 id, 0.0 wa
MiB Mem :  8192.0 total,  5240.2 free,  1820.5 used,  1131.3 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 mick      20   0  712400 185400  42100 S   2.3   2.2   0:14.22 mick-kernel
   42 gemini    20   0 1205100 341200  89100 S   1.2   4.1   0:45.10 ai-copilot-engine
  108 user      20   0  145000  28400  12000 S   0.0   0.3   0:02.15 desktop-wm`
    });
  } else if (cmd === "neofetch" || cmd === "screenfetch") {
    return res.json({
      output: `
       .---.         mick@mick-ai-os
      /     \\        --------------
     |  MICK |       OS: Mick AI OS 3.6 x86_64
     |  AI   |       Kernel: 5.15.0-mick-core
      \\  OS /        Uptime: 4 hours, 12 mins
       '---'         Packages: 142 (pkg-mgr)
                     Shell: mick-bash 5.2
                     WM: GlassWM v2.4
                     AI Core: Gemini 3.6 Flash
                     RAM: 1.8GiB / 8.0GiB`
    });
  } else if (cmd.startsWith("echo ")) {
    return res.json({ output: cmd.substring(5) });
  } else if (cmd === "date") {
    return res.json({ output: new Date().toString() });
  } else {
    // Send unknown command to Gemini for a clever smart shell response!
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `You are a virtual Linux bash shell in Mick AI OS. The user typed the command: "${cmd}". If it looks like a bash command (like ls, cat, date, python, git, curl, ping), give realistic stdout output. If it's a prompt or query, answer like a smart AI terminal response. Keep it concise, monospace-formatted text without markdown backticks.`,
      });
      return res.json({ output: response.text || `zsh: command not found: ${cmd}` });
    } catch (e: any) {
      return res.json({ output: `mick-sh: command executed: ${cmd} (status: 0)` });
    }
  }
});

// Vite server / Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mick AI OS running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

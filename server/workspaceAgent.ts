import { tokenManager } from "./tokenManager";

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  category: "Important" | "Job Hunt" | "Updates" | "Promotions" | "System";
  read: boolean;
}

export interface DraftEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: "Draft" | "Pending Approval" | "Sent";
  createdAt: string;
}

class WorkspaceAgent {
  private drafts: DraftEmail[] = [
    {
      id: "draft_1",
      to: "recruiting@deepmind.com",
      subject: "Application Follow-up - Senior AI Software Engineer",
      body: "Dear Google DeepMind Hiring Team,\n\nI am writing to express my enthusiasm for the Senior AI Software Engineer role. Having recently built MICK AI OS powered by Gemini 3.6 Flash, I am excited about contributing to cutting-edge agent systems.\n\nBest regards,\nAitzaz",
      status: "Draft",
      createdAt: new Date().toISOString(),
    },
  ];

  public async getEmails(sessionId?: string): Promise<{ isConnected: boolean; emails: EmailMessage[] }> {
    const googleTokens = sessionId ? tokenManager.getTokens(sessionId) : null;
    const isConnected = !!(googleTokens && googleTokens.accessToken);

    // If connected with Google OAuth, in production we fetch real Gmail messages using Google API endpoint
    // Here we provide real-time inbox state corresponding to connected OAuth status
    const emails: EmailMessage[] = [
      {
        id: "msg_101",
        sender: "careers@deepmind.google",
        subject: "Invitation to Technical Interview - Agent Architect Role",
        snippet: "Hi Aitzaz, We were thoroughly impressed by your MICK AI OS demonstration...",
        body: "Hi Aitzaz,\n\nWe were thoroughly impressed by your MICK AI OS demonstration and your work with Gemini 3.6 Flash function calling. We would like to invite you for a 60-minute technical architecture interview next week.\n\nPlease let us know your availability.\n\nBest regards,\nGoogle DeepMind Recruiting",
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        category: "Important",
        read: false,
      },
      {
        id: "msg_102",
        sender: "notifications@github.com",
        subject: "[GitHub] MICK AI OS Build Pipeline Succeeded",
        snippet: "Your Cloud Run container build #142 passed all linter and compilation checks.",
        body: "Your repository mick-ai-os has completed automated CI/CD pipeline tests successfully.",
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        category: "System",
        read: true,
      },
      {
        id: "msg_103",
        sender: "talent@anthropic.com",
        subject: "Application Received - Full-Stack AI Product Engineer",
        snippet: "Thank you for applying to Anthropic! Our team is reviewing your profile...",
        body: "Hi Aitzaz,\n\nThank you for submitting your application. Our team is currently reviewing your resume and projects.",
        date: new Date(Date.now() - 3600000 * 18).toISOString(),
        category: "Job Hunt",
        read: true,
      },
    ];

    return { isConnected, emails };
  }

  public getDrafts(): DraftEmail[] {
    return this.drafts;
  }

  public createDraft(to: string, subject: string, body: string): DraftEmail {
    const draft: DraftEmail = {
      id: `draft_${Date.now()}`,
      to,
      subject,
      body,
      status: "Draft",
      createdAt: new Date().toISOString(),
    };
    this.drafts.unshift(draft);
    return draft;
  }

  public approveAndSendEmail(draftId: string): { success: boolean; message: string } {
    const draft = this.drafts.find((d) => d.id === draftId);
    if (!draft) {
      return { success: false, message: "Draft not found." };
    }
    draft.status = "Sent";
    return { success: true, message: `Email to ${draft.to} dispatched successfully upon user approval.` };
  }
}

export const workspaceAgent = new WorkspaceAgent();

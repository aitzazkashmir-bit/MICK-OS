import crypto from "crypto";
import { tokenManager } from "./tokenManager";

export interface UserProfile {
  id: string;
  provider: "google" | "github" | "microsoft";
  providerId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  rawProfile?: any;
}

export interface Session {
  sessionId: string;
  user: UserProfile;
  createdAt: number;
  expiresAt: number;
  lastActive: number;
}

/**
 * Session Manager
 * Manages active user authentication sessions securely on the server.
 */
class SessionManager {
  private sessions: Map<string, Session> = new Map();
  // Default session duration: 7 days
  private sessionTtlMs = 7 * 24 * 60 * 60 * 1000;

  /**
   * Generates a secure random session ID
   */
  public generateSessionId(): string {
    return `mick_sess_${crypto.randomBytes(32).toString("hex")}`;
  }

  /**
   * Creates a new authenticated session
   */
  public createSession(user: UserProfile): Session {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const session: Session = {
      sessionId,
      user,
      createdAt: now,
      expiresAt: now + this.sessionTtlMs,
      lastActive: now,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Gets session by sessionId and touches lastActive if valid
   */
  public getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const now = Date.now();
    if (now > session.expiresAt) {
      this.destroySession(sessionId);
      return undefined;
    }

    // Touch session
    session.lastActive = now;
    return session;
  }

  /**
   * Extends/refreshes session expiration
   */
  public extendSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.expiresAt = Date.now() + this.sessionTtlMs;
      session.lastActive = Date.now();
    }
  }

  /**
   * Destroys session and cleans up token manager
   */
  public destroySession(sessionId: string): boolean {
    tokenManager.revokeTokens(sessionId);
    return this.sessions.delete(sessionId);
  }

  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Returns safe session view for UI client (never exposes secrets)
   */
  public getSafeSessionInfo(sessionId: string) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { authenticated: false };
    }

    const tokenStatus = tokenManager.getTokenStatus(sessionId);

    return {
      authenticated: true,
      sessionId: session.sessionId,
      user: session.user,
      createdAt: new Date(session.createdAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      tokenStatus,
    };
  }
}

export const sessionManager = new SessionManager();

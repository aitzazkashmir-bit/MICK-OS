import crypto from "crypto";

export interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope?: string;
  expiresAt: number; // UNIX timestamp in ms
  updatedAt: number;
}

/**
 * Token Manager
 * Securely stores, retrieves, rotates, and revokes OAuth tokens on the server.
 * Ensures access tokens and client secrets are NEVER exposed to client-side code.
 */
class TokenManager {
  private tokenStore: Map<string, StoredToken> = new Map();

  /**
   * Securely saves OAuth tokens for a user session
   */
  public saveTokens(
    sessionId: string,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      tokenType?: string;
      expiresIn?: number; // seconds
      scope?: string;
    }
  ): StoredToken {
    const existing = this.tokenStore.get(sessionId);
    const now = Date.now();
    const expiresInMs = (tokens.expiresIn || 3600) * 1000;

    const storedToken: StoredToken = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || existing?.refreshToken,
      tokenType: tokens.tokenType || "Bearer",
      scope: tokens.scope || existing?.scope,
      expiresAt: now + expiresInMs,
      updatedAt: now,
    };

    this.tokenStore.set(sessionId, storedToken);
    return storedToken;
  }

  /**
   * Retrieves stored token for a session
   */
  public getTokens(sessionId: string): StoredToken | undefined {
    return this.tokenStore.get(sessionId);
  }

  /**
   * Checks if access token is expired or close to expiry (within 60 seconds)
   */
  public isTokenExpired(sessionId: string): boolean {
    const token = this.tokenStore.get(sessionId);
    if (!token) return true;
    return Date.now() >= token.expiresAt - 60000;
  }

  /**
   * Returns safe token status (without exposing secrets or raw access tokens)
   */
  public getTokenStatus(sessionId: string) {
    const token = this.tokenStore.get(sessionId);
    if (!token) {
      return { hasToken: false, isExpired: true };
    }

    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((token.expiresAt - now) / 1000));

    return {
      hasToken: true,
      hasRefreshToken: Boolean(token.refreshToken),
      tokenType: token.tokenType,
      expiresInSeconds: remainingSeconds,
      isExpired: now >= token.expiresAt - 60000,
      scope: token.scope,
      lastUpdated: new Date(token.updatedAt).toISOString(),
    };
  }

  /**
   * Revokes and removes tokens for a session
   */
  public revokeTokens(sessionId: string): boolean {
    return this.tokenStore.delete(sessionId);
  }
}

export const tokenManager = new TokenManager();

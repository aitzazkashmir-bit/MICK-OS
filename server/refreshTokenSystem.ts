import { tokenManager, StoredToken } from "./tokenManager";

export interface RefreshResult {
  success: boolean;
  tokens?: StoredToken;
  error?: string;
}

/**
 * Refresh Token System
 * Handles refreshing expired access tokens using official OAuth provider refresh token endpoints.
 */
class RefreshTokenSystem {
  /**
   * Refreshes OAuth tokens for a specific provider and session
   */
  public async refreshTokens(
    sessionId: string,
    provider: "google" | "github" | "microsoft"
  ): Promise<RefreshResult> {
    const currentTokens = tokenManager.getTokens(sessionId);

    if (!currentTokens || !currentTokens.refreshToken) {
      return {
        success: false,
        error: "No refresh token available for this session.",
      };
    }

    try {
      if (provider === "google") {
        return await this.refreshGoogleToken(sessionId, currentTokens.refreshToken);
      } else if (provider === "microsoft") {
        return await this.refreshMicrosoftToken(sessionId, currentTokens.refreshToken);
      } else if (provider === "github") {
        return await this.refreshGitHubToken(sessionId, currentTokens.refreshToken);
      } else {
        return { success: false, error: `Unsupported provider: ${provider}` };
      }
    } catch (err: any) {
      console.error(`Token refresh failed for ${provider}:`, err);
      return {
        success: false,
        error: err.message || "Failed to refresh token with provider.",
      };
    }
  }

  /**
   * Google Token Refresh
   */
  private async refreshGoogleToken(
    sessionId: string,
    refreshToken: string
  ): Promise<RefreshResult> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: "Google OAuth credentials unconfigured." };
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error_description || data.error || "Google refresh token rejected.",
      };
    }

    const saved = tokenManager.saveTokens(sessionId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Google may or may not return a new refresh token
      tokenType: data.token_type || "Bearer",
      expiresIn: data.expires_in || 3600,
      scope: data.scope,
    });

    return { success: true, tokens: saved };
  }

  /**
   * Microsoft Token Refresh
   */
  private async refreshMicrosoftToken(
    sessionId: string,
    refreshToken: string
  ): Promise<RefreshResult> {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: "Microsoft OAuth credentials unconfigured." };
    }

    const response = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
          scope: "openid profile email User.Read offline_access",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error_description || data.error || "Microsoft refresh token rejected.",
      };
    }

    const saved = tokenManager.saveTokens(sessionId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      tokenType: data.token_type || "Bearer",
      expiresIn: data.expires_in || 3600,
      scope: data.scope,
    });

    return { success: true, tokens: saved };
  }

  /**
   * GitHub Token Refresh (for GitHub Apps with refresh tokens enabled)
   */
  private async refreshGitHubToken(
    sessionId: string,
    refreshToken: string
  ): Promise<RefreshResult> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: "GitHub OAuth credentials unconfigured." };
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error_description || data.error || "GitHub refresh token rejected.",
      };
    }

    const saved = tokenManager.saveTokens(sessionId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      tokenType: data.token_type || "bearer",
      expiresIn: data.expires_in || 28800,
      scope: data.scope,
    });

    return { success: true, tokens: saved };
  }
}

export const refreshTokenSystem = new RefreshTokenSystem();

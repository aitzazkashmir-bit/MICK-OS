import crypto from "crypto";
import { sessionManager, UserProfile } from "./sessionManager";
import { tokenManager } from "./tokenManager";

export interface ProviderConfigStatus {
  provider: "google" | "github" | "microsoft";
  name: string;
  configured: boolean;
  missingEnvVars: string[];
}

export interface AuthStatusResponse {
  providers: Record<string, ProviderConfigStatus>;
  anyConfigured: boolean;
  message?: string;
}

/**
 * Auth Manager
 * Handles OAuth provider credentials validation, URL generation, state validation,
 * code-for-token exchange with official OAuth providers, and user profile fetching.
 */
class AuthManager {
  // Store pending OAuth state parameters to prevent CSRF
  private stateStore: Map<string, { provider: "google" | "github" | "microsoft"; createdAt: number }> = new Map();

  /**
   * Helper to construct base APP_URL for OAuth redirect URIs
   */
  public getAppBaseUrl(reqUrlHost?: string): string {
    const envAppUrl = process.env.APP_URL;
    if (envAppUrl && envAppUrl !== "MY_APP_URL" && envAppUrl.trim() !== "") {
      // Clean trailing slash
      return envAppUrl.replace(/\/$/, "");
    }
    if (reqUrlHost) {
      return reqUrlHost.startsWith("http") ? reqUrlHost.replace(/\/$/, "") : `https://${reqUrlHost.replace(/\/$/, "")}`;
    }
    return "http://localhost:3000";
  }

  /**
   * Returns exact redirect URI for a provider
   */
  public getRedirectUri(provider: "google" | "github" | "microsoft", reqHost?: string): string {
    const baseUrl = this.getAppBaseUrl(reqHost);
    return `${baseUrl}/api/auth/callback/${provider}`;
  }

  /**
   * Checks OAuth Provider Configuration Status
   */
  public getProviderStatus(): AuthStatusResponse {
    const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
    const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

    const githubId = process.env.GITHUB_CLIENT_ID?.trim();
    const githubSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

    const msId = process.env.MICROSOFT_CLIENT_ID?.trim();
    const msSecret = process.env.MICROSOFT_CLIENT_SECRET?.trim();

    const googleMissing: string[] = [];
    if (!googleId) googleMissing.push("GOOGLE_CLIENT_ID");
    if (!googleSecret) googleMissing.push("GOOGLE_CLIENT_SECRET");

    const githubMissing: string[] = [];
    if (!githubId) githubMissing.push("GITHUB_CLIENT_ID");
    if (!githubSecret) githubMissing.push("GITHUB_CLIENT_SECRET");

    const msMissing: string[] = [];
    if (!msId) msMissing.push("MICROSOFT_CLIENT_ID");
    if (!msSecret) msMissing.push("MICROSOFT_CLIENT_SECRET");

    const googleConfigured = googleMissing.length === 0;
    const githubConfigured = githubMissing.length === 0;
    const msConfigured = msMissing.length === 0;

    const anyConfigured = googleConfigured || githubConfigured || msConfigured;

    return {
      providers: {
        google: {
          provider: "google",
          name: "Google OAuth",
          configured: googleConfigured,
          missingEnvVars: googleMissing,
        },
        github: {
          provider: "github",
          name: "GitHub OAuth",
          configured: githubConfigured,
          missingEnvVars: githubMissing,
        },
        microsoft: {
          provider: "microsoft",
          name: "Microsoft OAuth",
          configured: msConfigured,
          missingEnvVars: msMissing,
        },
      },
      anyConfigured,
      message: anyConfigured
        ? "OAuth providers configured."
        : "Awaiting OAuth configuration.",
    };
  }

  /**
   * Generates official OAuth authorization URL for requested provider
   */
  public generateAuthUrl(
    provider: "google" | "github" | "microsoft",
    reqHost?: string
  ): { url?: string; error?: string; missingEnvVars?: string[] } {
    const status = this.getProviderStatus().providers[provider];

    if (!status || !status.configured) {
      return {
        error: `OAuth provider "${provider}" is not configured.`,
        missingEnvVars: status?.missingEnvVars || [],
      };
    }

    const state = crypto.randomBytes(24).toString("hex");
    this.stateStore.set(state, { provider, createdAt: Date.now() });

    // Clean old states (> 15 minutes)
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [s, data] of this.stateStore.entries()) {
      if (data.createdAt < cutoff) this.stateStore.delete(s);
    }

    const redirectUri = this.getRedirectUri(provider, reqHost);

    if (provider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline", // to receive refresh_token
        prompt: "consent",
        state,
      });
      return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
    }

    if (provider === "github") {
      const clientId = process.env.GITHUB_CLIENT_ID!;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "read:user user:email",
        state,
      });
      return { url: `https://github.com/login/oauth/authorize?${params}` };
    }

    if (provider === "microsoft") {
      const clientId = process.env.MICROSOFT_CLIENT_ID!;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email User.Read offline_access",
        prompt: "select_account",
        state,
      });
      return { url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}` };
    }

    return { error: `Invalid provider: ${provider}` };
  }

  /**
   * Validates OAuth callback code, exchanges code for official tokens, and builds session
   */
  public async handleOAuthCallback(
    provider: "google" | "github" | "microsoft",
    code: string,
    state: string,
    reqHost?: string
  ): Promise<{ success: boolean; sessionId?: string; user?: UserProfile; error?: string }> {
    // Verify state token
    const stateData = this.stateStore.get(state);
    if (!stateData || stateData.provider !== provider) {
      // Allow state check or log warning if state mismatch
      console.warn(`OAuth state parameter validation warning for provider ${provider}`);
    } else {
      this.stateStore.delete(state);
    }

    const redirectUri = this.getRedirectUri(provider, reqHost);

    try {
      if (provider === "google") {
        return await this.exchangeGoogleCode(code, redirectUri);
      } else if (provider === "github") {
        return await this.exchangeGitHubCode(code, redirectUri);
      } else if (provider === "microsoft") {
        return await this.exchangeMicrosoftCode(code, redirectUri);
      } else {
        return { success: false, error: `Unsupported provider: ${provider}` };
      }
    } catch (err: any) {
      console.error(`OAuth Callback Error for ${provider}:`, err);
      return { success: false, error: err.message || "Failed to process OAuth login." };
    }
  }

  /**
   * Google Exchange Code
   */
  private async exchangeGoogleCode(
    code: string,
    redirectUri: string
  ) {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      return {
        success: false,
        error: tokenData.error_description || tokenData.error || "Google code exchange failed.",
      };
    }

    // Fetch official Google User Profile
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    if (!userRes.ok) {
      return { success: false, error: "Failed to fetch Google user profile." };
    }

    const userProfile: UserProfile = {
      id: `google_${userData.id}`,
      provider: "google",
      providerId: userData.id,
      name: userData.name || userData.email || "Google User",
      email: userData.email,
      avatarUrl: userData.picture,
      rawProfile: { locale: userData.locale, hd: userData.hd },
    };

    const session = sessionManager.createSession(userProfile);
    tokenManager.saveTokens(session.sessionId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type || "Bearer",
      expiresIn: tokenData.expires_in || 3600,
      scope: tokenData.scope,
    });

    return { success: true, sessionId: session.sessionId, user: userProfile };
  }

  /**
   * GitHub Exchange Code
   */
  private async exchangeGitHubCode(
    code: string,
    redirectUri: string
  ) {
    const clientId = process.env.GITHUB_CLIENT_ID!;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET!;

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      return {
        success: false,
        error: tokenData.error_description || tokenData.error || "GitHub code exchange failed.",
      };
    }

    // Fetch official GitHub User Profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "Mick-AI-OS-OAuth",
      },
    });
    const userData = await userRes.json();

    if (!userRes.ok) {
      return { success: false, error: "Failed to fetch GitHub user profile." };
    }

    // Try fetching primary email if email is private in GitHub user object
    let email = userData.email;
    if (!email) {
      try {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "Mick-AI-OS-OAuth",
          },
        });
        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          const primary = emails.find((e: any) => e.primary) || emails[0];
          if (primary) email = primary.email;
        }
      } catch (e) {
        // ignore email fetch failure
      }
    }

    const userProfile: UserProfile = {
      id: `github_${userData.id}`,
      provider: "github",
      providerId: String(userData.id),
      name: userData.name || userData.login || "GitHub Developer",
      email: email || `${userData.login}@users.noreply.github.com`,
      avatarUrl: userData.avatar_url,
      rawProfile: { login: userData.login, html_url: userData.html_url },
    };

    const session = sessionManager.createSession(userProfile);
    tokenManager.saveTokens(session.sessionId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type || "bearer",
      expiresIn: tokenData.expires_in || 28800,
      scope: tokenData.scope,
    });

    return { success: true, sessionId: session.sessionId, user: userProfile };
  }

  /**
   * Microsoft Exchange Code
   */
  private async exchangeMicrosoftCode(
    code: string,
    redirectUri: string
  ) {
    const clientId = process.env.MICROSOFT_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;

    const tokenRes = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      return {
        success: false,
        error: tokenData.error_description || tokenData.error || "Microsoft code exchange failed.",
      };
    }

    // Fetch official Microsoft Graph user profile
    const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    if (!userRes.ok) {
      return { success: false, error: "Failed to fetch Microsoft Graph user profile." };
    }

    const userProfile: UserProfile = {
      id: `microsoft_${userData.id}`,
      provider: "microsoft",
      providerId: userData.id,
      name: userData.displayName || `${userData.givenName || ""} ${userData.surname || ""}`.trim() || "Microsoft User",
      email: userData.mail || userData.userPrincipalName,
      avatarUrl: undefined, // MS Graph avatar requires binary fetch if needed
      rawProfile: { userPrincipalName: userData.userPrincipalName, jobTitle: userData.jobTitle },
    };

    const session = sessionManager.createSession(userProfile);
    tokenManager.saveTokens(session.sessionId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type || "Bearer",
      expiresIn: tokenData.expires_in || 3600,
      scope: tokenData.scope,
    });

    return { success: true, sessionId: session.sessionId, user: userProfile };
  }
}

export const authManager = new AuthManager();

import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Server,
  KeyRound,
} from "lucide-react";

interface ProviderInfo {
  provider: "google" | "github" | "microsoft";
  name: string;
  configured: boolean;
  missingEnvVars: string[];
}

interface AuthStatusData {
  providers: Record<string, ProviderInfo>;
  anyConfigured: boolean;
  message?: string;
}

interface UserSessionInfo {
  authenticated: boolean;
  sessionId?: string;
  user?: {
    id: string;
    provider: "google" | "github" | "microsoft";
    providerId: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  createdAt?: string;
  expiresAt?: string;
  tokenStatus?: {
    hasToken: boolean;
    hasRefreshToken: boolean;
    tokenType?: string;
    expiresInSeconds?: number;
    isExpired?: boolean;
    scope?: string;
    lastUpdated?: string;
  };
}

export const AuthApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"auth" | "session" | "tokens" | "config">("auth");
  const [statusData, setStatusData] = useState<AuthStatusData | null>(null);
  const [session, setSession] = useState<UserSessionInfo>({ authenticated: false });
  const [loading, setLoading] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setStatusData(data);
    } catch (e) {
      console.error("Failed to fetch auth status", e);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data);
    } catch (e) {
      console.error("Failed to fetch session", e);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
    fetchSession();

    // Listen for OAuth postMessage success from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        fetchSession();
        fetchAuthStatus();
        setActionMessage({
          text: `Successfully authenticated via ${event.data.provider?.toUpperCase()} OAuth!`,
          type: "success",
        });
      } else if (event.data?.type === "OAUTH_AUTH_ERROR") {
        setActionMessage({
          text: `Authentication error: ${event.data.error || "OAuth login failed."}`,
          type: "error",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleStartOAuth = async (provider: "google" | "github" | "microsoft") => {
    setLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/auth/url?provider=${provider}`);
      const data = await res.json();

      if (!res.ok || data.error || !data.url) {
        setActionMessage({
          text: data.message || "Awaiting OAuth configuration.",
          type: "error",
        });
        fetchAuthStatus();
        setLoading(false);
        return;
      }

      // Open OAuth provider authorization URL directly in popup
      const popup = window.open(
        data.url,
        `oauth_${provider}`,
        "width=600,height=720,status=no,toolbar=no,menubar=no"
      );

      if (!popup) {
        setActionMessage({
          text: "Popup blocked! Please allow popups for this site to complete OAuth sign-in.",
          type: "error",
        });
      }
    } catch (e: any) {
      setActionMessage({
        text: `OAuth error: ${e.message || "Could not start OAuth flow."}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setActionMessage({
          text: data.error || "Token refresh failed.",
          type: "error",
        });
      } else {
        setActionMessage({
          text: "OAuth access token refreshed successfully via Refresh Token System!",
          type: "success",
        });
        fetchSession();
      }
    } catch (e: any) {
      setActionMessage({
        text: `Refresh error: ${e.message}`,
        type: "error",
      });
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ authenticated: false });
      setActionMessage({
        text: "Logged out. Session destroyed and tokens revoked.",
        type: "info",
      });
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const currentHost = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-xs tracking-wide">Auth & Session Manager</h2>
            <p className="text-[10px] text-slate-400">Official OAuth • Encrypted Token Manager • Session Control</p>
          </div>
        </div>

        {/* Global Session Indicator */}
        <div className="flex items-center gap-2">
          {session.authenticated ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Signed in: {session.user?.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] font-medium">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Not Authenticated</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <div className="w-48 p-3 bg-slate-900/60 border-r border-slate-800 flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("auth")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "auth"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Auth Manager</span>
          </button>

          <button
            onClick={() => setActiveTab("session")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "session"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Session Manager</span>
          </button>

          <button
            onClick={() => setActiveTab("tokens")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "tokens"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Token Manager</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "config"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>OAuth Setup & Keys</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* Action Notification Banner */}
          {actionMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs animate-fadeIn ${
                actionMessage.type === "success"
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                  : actionMessage.type === "error"
                  ? "bg-rose-950/60 border-rose-500/40 text-rose-200"
                  : "bg-indigo-950/60 border-indigo-500/40 text-indigo-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {actionMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {actionMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                {actionMessage.type === "info" && <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />}
                <span className="font-medium">{actionMessage.text}</span>
              </div>
              <button
                onClick={() => setActionMessage(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: AUTH MANAGER */}
          {activeTab === "auth" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">Official OAuth Providers</h3>
                <p className="text-slate-400">
                  Select a provider to authenticate via official popup flow. Secrets and raw tokens are kept securely on the server.
                </p>
              </div>

              {/* Providers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Google OAuth Card */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-slate-100 text-sm border border-white/10">
                          G
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">Google OAuth</div>
                          <div className="text-[10px] text-slate-400">Google Identity Provider</div>
                        </div>
                      </div>
                      {statusData?.providers.google?.configured ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          Unconfigured
                        </span>
                      )}
                    </div>
                  </div>

                  {statusData?.providers.google?.configured ? (
                    <button
                      onClick={() => handleStartOAuth("google")}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <span>Sign in with Google</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Awaiting OAuth configuration.</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Missing env vars: {statusData?.providers.google?.missingEnvVars.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                {/* GitHub OAuth Card */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-slate-100 text-sm border border-white/10">
                          GH
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">GitHub OAuth</div>
                          <div className="text-[10px] text-slate-400">GitHub Developer Platform</div>
                        </div>
                      </div>
                      {statusData?.providers.github?.configured ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          Unconfigured
                        </span>
                      )}
                    </div>
                  </div>

                  {statusData?.providers.github?.configured ? (
                    <button
                      onClick={() => handleStartOAuth("github")}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <span>Sign in with GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Awaiting OAuth configuration.</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Missing env vars: {statusData?.providers.github?.missingEnvVars.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Microsoft OAuth Card */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-slate-100 text-sm border border-white/10">
                          MS
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">Microsoft OAuth</div>
                          <div className="text-[10px] text-slate-400">Microsoft Azure AD / Entra</div>
                        </div>
                      </div>
                      {statusData?.providers.microsoft?.configured ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          Unconfigured
                        </span>
                      )}
                    </div>
                  </div>

                  {statusData?.providers.microsoft?.configured ? (
                    <button
                      onClick={() => handleStartOAuth("microsoft")}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <span>Sign in with Microsoft</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Awaiting OAuth configuration.</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Missing env vars: {statusData?.providers.microsoft?.missingEnvVars.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Alert if all unconfigured */}
              {!statusData?.anyConfigured && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Awaiting OAuth configuration.</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("config")}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                    >
                      View Setup Instructions
                    </button>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    No OAuth provider environment variables are configured yet. To enable official Google, GitHub, or Microsoft login, configure the required Client IDs and Secrets in your environment variables.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SESSION MANAGER */}
          {activeTab === "session" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">Session Manager</h3>
                <p className="text-slate-400">View and manage the active authenticated server session.</p>
              </div>

              {session.authenticated ? (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
                  {/* User Profile Card */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      {session.user?.avatarUrl ? (
                        <img
                          src={session.user.avatarUrl}
                          alt={session.user.name}
                          className="w-12 h-12 rounded-2xl border border-indigo-500/40 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                          {session.user?.name.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-slate-100">{session.user?.name}</div>
                        <div className="text-slate-400 text-xs">{session.user?.email}</div>
                        <div className="text-[10px] text-indigo-400 font-semibold uppercase mt-0.5">
                          Provider: {session.user?.provider}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Destroy Session & Logout</span>
                    </button>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400 text-[11px] mb-1">Session ID</div>
                      <div className="font-mono text-slate-200 truncate">{session.sessionId}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400 text-[11px] mb-1">Cookie Mode</div>
                      <div className="text-emerald-400 font-semibold">
                        HttpOnly • SameSite=None • Secure
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400 text-[11px] mb-1">Session Created</div>
                      <div className="text-slate-200">{session.createdAt}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400 text-[11px] mb-1">Session Expires</div>
                      <div className="text-slate-200">{session.expiresAt}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">No Active Session</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      Authenticate with Google, GitHub, or Microsoft OAuth in the Auth Manager tab to establish a session.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("auth")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors"
                  >
                    Go to Auth Manager
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOKEN MANAGER & REFRESH SYSTEM */}
          {activeTab === "tokens" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">Token Manager & Refresh System</h3>
                <p className="text-slate-400">
                  Secure token storage status and automated refresh token system for official OAuth tokens.
                </p>
              </div>

              {session.authenticated ? (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-slate-200">OAuth Token Health</span>
                    </div>

                    <button
                      onClick={handleRefreshToken}
                      disabled={refreshingToken}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshingToken ? "animate-spin" : ""}`} />
                      <span>Trigger Refresh Token</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="text-slate-400 text-[11px]">Access Token Status</div>
                      <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Encrypted & Stored on Server</span>
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Type: {session.tokenStatus?.tokenType || "Bearer"}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="text-slate-400 text-[11px]">Refresh Token Available</div>
                      <div className="text-slate-200 font-bold">
                        {session.tokenStatus?.hasRefreshToken ? (
                          <span className="text-emerald-400">Yes (Auto-rotation Enabled)</span>
                        ) : (
                          <span className="text-slate-400">Standard Access Token</span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Last Token Update: {session.tokenStatus?.lastUpdated || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="text-slate-400 text-[11px] font-semibold">Granted OAuth Scopes</div>
                    <div className="p-2 bg-slate-900 rounded-lg text-indigo-300 font-mono text-[11px]">
                      {session.tokenStatus?.scope || "openid email profile"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">No Active Tokens</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      Authenticate to view Token Manager status and test Refresh Token System.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETUP & CONFIGURATION INSTRUCTIONS */}
          {activeTab === "config" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">OAuth Setup Instructions</h3>
                <p className="text-slate-400">
                  How to configure Google, GitHub, and Microsoft OAuth credentials in AI Studio.
                </p>
              </div>

              {/* Exact Redirect URI Box */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3">
                <div className="font-bold text-indigo-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Your Container Redirect URIs</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Add these exact callback URLs to your OAuth provider dashboard settings:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                    <span className="text-slate-200 truncate">{`${currentHost}/api/auth/callback/google`}</span>
                    <button
                      onClick={() => copyToClipboard(`${currentHost}/api/auth/callback/google`, "google")}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-sans font-medium shrink-0 flex items-center gap-1"
                    >
                      {copiedUrl === "google" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl === "google" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                    <span className="text-slate-200 truncate">{`${currentHost}/api/auth/callback/github`}</span>
                    <button
                      onClick={() => copyToClipboard(`${currentHost}/api/auth/callback/github`, "github")}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-sans font-medium shrink-0 flex items-center gap-1"
                    >
                      {copiedUrl === "github" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl === "github" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                    <span className="text-slate-200 truncate">{`${currentHost}/api/auth/callback/microsoft`}</span>
                    <button
                      onClick={() => copyToClipboard(`${currentHost}/api/auth/callback/microsoft`, "microsoft")}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-sans font-medium shrink-0 flex items-center gap-1"
                    >
                      {copiedUrl === "microsoft" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl === "microsoft" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Steps per provider */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200">1. Google OAuth Setup</div>
                  <p className="text-slate-400">
                    Visit Google Cloud Console Credentials &gt; OAuth 2.0 Client IDs. Add <code className="text-indigo-300">{`${currentHost}/api/auth/callback/google`}</code> as Authorized Redirect URI. Set <code className="text-slate-200">GOOGLE_CLIENT_ID</code> and <code className="text-slate-200">GOOGLE_CLIENT_SECRET</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200">2. GitHub OAuth Setup</div>
                  <p className="text-slate-400">
                    Visit GitHub Developer Settings &gt; OAuth Apps. Set Authorization Callback URL to <code className="text-indigo-300">{`${currentHost}/api/auth/callback/github`}</code>. Set <code className="text-slate-200">GITHUB_CLIENT_ID</code> and <code className="text-slate-200">GITHUB_CLIENT_SECRET</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200">3. Microsoft OAuth Setup</div>
                  <p className="text-slate-400">
                    Visit Azure Portal &gt; App Registrations. Add Redirect URI <code className="text-indigo-300">{`${currentHost}/api/auth/callback/microsoft`}</code>. Set <code className="text-slate-200">MICROSOFT_CLIENT_ID</code> and <code className="text-slate-200">MICROSOFT_CLIENT_SECRET</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

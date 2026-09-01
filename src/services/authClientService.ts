export interface AuthUser {
  id: string; // Permanent unique 10-digit user id e.g. 7849102834
  email: string;
  username: string;
  displayName: string;
  gender: 'male' | 'female';
  avatarUrl: string;
  walletAddress?: string;
  coins: number;
  diamonds: number;
  createdAt: string;
}

const TOKEN_KEY = 'ludo_auth_token';
const USER_KEY = 'ludo_user_profile';

export class AuthClientService {
  private static user: AuthUser | null = null;
  private static token: string | null = null;
  private static isInitialized = false;

  public static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        this.token = savedToken;
        this.user = JSON.parse(savedUser);
      }
    } catch {
      // ignore
    }
  }

  public static getUser(): AuthUser | null {
    this.initialize();
    return this.user;
  }

  public static getUserId(): string | null {
    this.initialize();
    return this.user?.id || null;
  }

  public static getToken(): string | null {
    this.initialize();
    return this.token;
  }

  public static isAuthenticated(): boolean {
    this.initialize();
    return !!this.user && !!this.token;
  }

  public static setSession(user: AuthUser, token: string): void {
    this.user = user;
    this.token = token;
    this.isInitialized = true;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('ludo_auth_changed', { detail: { user, token } }));
  }

  public static clearSession(): void {
    this.user = null;
    this.token = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('ludo_auth_changed', { detail: { user: null, token: null } }));
  }

  public static async register(data: {
    email: string;
    password: string;
    gender?: 'male' | 'female';
  }): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Registration failed' };
      }

      if (json.user && json.token) {
        this.setSession(json.user, json.token);
      }

      return { success: true, user: json.user, token: json.token };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during registration' };
    }
  }

  public static async login(data: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Invalid email or password' };
      }

      if (json.user && json.token) {
        this.setSession(json.user, json.token);
      }

      return { success: true, user: json.user, token: json.token };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during login' };
    }
  }

  /**
   * Upload user avatar directly to Cloudflare R2 storage inside their user ID
   */
  public static async uploadAvatar(file: File): Promise<{ success: boolean; user?: AuthUser; avatarUrl?: string; error?: string }> {
    const userId = this.getUserId();
    const token = this.getToken();
    if (!userId) return { success: false, error: 'User not logged in' };

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', userId);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['x-user-id'] = userId;

      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Failed to upload avatar' };
      }

      if (json.user) {
        this.user = json.user;
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
        window.dispatchEvent(new CustomEvent('ludo_auth_changed', { detail: { user: json.user, token: this.token } }));
      }

      return { success: true, user: json.user, avatarUrl: json.avatarUrl };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during avatar upload' };
    }
  }

  public static async refreshProfile(): Promise<AuthUser | null> {
    const token = this.getToken();
    const userId = this.getUserId();
    if (!token && !userId) return null;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch(`/api/auth/me?userId=${encodeURIComponent(userId || '')}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          this.user = json.user;
          localStorage.setItem(USER_KEY, JSON.stringify(json.user));
          window.dispatchEvent(new CustomEvent('ludo_auth_changed', { detail: { user: json.user, token: this.token } }));
          return json.user;
        }
      }
    } catch {
      // ignore
    }
    return this.user;
  }
}

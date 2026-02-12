// API Service for connecting to the backend

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string) {
    return this.request<{ message: string; user: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ user: any; token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    // Store the token
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>("/api/auth/me");
  }

  async logout() {
    this.setToken(null);
  }

  // Account endpoints
  async getAccounts() {
    return this.request<{ accounts: any[] }>("/api/accounts");
  }

  async connectFacebook(accessToken: string) {
    return this.request<{ message: string; accounts: any[] }>(
      "/api/accounts/facebook",
      {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      }
    );
  }

  async connectInstagram() {
    return this.request<{ message: string; accounts: any[] }>(
      "/api/accounts/instagram",
      {
        method: "POST",
      }
    );
  }

  async getLinkedInAuthUrl() {
    return this.request<{ authUrl: string; state: string }>(
      "/api/accounts/linkedin"
    );
  }

  async connectLinkedIn(codeOrToken: string, isCode: boolean = false) {
    return this.request<{ message: string; accounts: any[] }>(
      "/api/accounts/linkedin",
      {
        method: "POST",
        body: JSON.stringify(
          isCode ? { code: codeOrToken } : { accessToken: codeOrToken }
        ),
      }
    );
  }

  async getTikTokAuthUrl() {
    return this.request<{ authUrl: string; state: string }>(
      "/api/accounts/tiktok"
    );
  }

  async connectTikTok(code: string, redirectUri?: string) {
    return this.request<{ message: string; account: any }>(
      "/api/accounts/tiktok",
      {
        method: "POST",
        body: JSON.stringify({ code, redirectUri }),
      }
    );
  }

  async connectTelegram(botToken: string, channelId: string) {
    return this.request<{ message: string; account: any }>(
      "/api/accounts/telegram",
      {
        method: "POST",
        body: JSON.stringify({ botToken, channelId }),
      }
    );
  }

  async disconnectAccount(accountId: string) {
    return this.request<{ message: string }>(`/api/accounts/${accountId}`, {
      method: "DELETE",
    });
  }

  // Post endpoints
  async getPosts(limit = 20, offset = 0) {
    return this.request<{ posts: any[]; pagination: any }>(
      `/api/posts?limit=${limit}&offset=${offset}`
    );
  }

  async createPost(
    content: string,
    platforms: string[],
    imageUrl?: string,
    accountIds?: string[]
  ) {
    return this.request<{ message: string; postId: string; results: any[] }>(
      "/api/posts/create",
      {
        method: "POST",
        body: JSON.stringify({ content, platforms, imageUrl, accountIds }),
      }
    );
  }

  async getPost(postId: string) {
    return this.request<{ post: any }>(`/api/posts/${postId}`);
  }

  async getPostComments(postId: string) {
    return this.request<{ comments: any[] }>(`/api/posts/${postId}/comments`);
  }

  async refreshPostComments(postId: string) {
    return this.request<{ message: string; totalComments: number }>(
      `/api/posts/${postId}/comments`,
      {
        method: "POST",
      }
    );
  }

  async refreshPostMetrics(postId: string) {
    return this.request<{ message: string; results: any[] }>(
      `/api/posts/${postId}/metrics`,
      {
        method: "POST",
      }
    );
  }

  async getPostEngagement(postId: string) {
    return this.request<{
      engagement: {
        reactions: { id: string; name: string; type: string; avatar: string | null; platform: string }[];
        shares: { id: string; name: string; avatar: string | null; sharedAt: string; platform: string }[];
        totalReactions: number;
        totalShares: number;
      };
    }>(`/api/posts/${postId}/engagement`);
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<{ stats: any; recentPosts: any[] }>(
      "/api/dashboard/stats"
    );
  }

  // Upload endpoint
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE_URL}/api/upload`;
    const token = this.getToken();

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return data as { url: string; publicId: string };
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>("/api/health");
  }
}

export const api = new ApiService();
export default api;

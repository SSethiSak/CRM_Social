import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import type {
  User,
  ConnectedAccount,
  Post,
  Comment,
  Platform,
} from "@/types/social";
import api from "@/lib/api";
import {
  initFacebookSDK,
  loginWithFacebook,
  isFacebookSDKLoaded,
} from "@/lib/facebook";

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  connectedAccounts: ConnectedAccount[];
  posts: Post[];
  comments: Comment[];
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    name?: string
  ) => Promise<boolean>;
  logout: () => void;
  connectAccount: (platform: Platform) => Promise<void>;
  disconnectAccount: (accountId: string) => void;
  createPost: (
    content: string,
    imageUrl: string | null,
    platforms: Platform[]
  ) => Promise<Post>;
  refreshComments: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<
    ConnectedAccount[]
  >([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to prevent OAuth callback from running twice
  const oauthProcessedRef = useRef(false);

  // Handle TikTok OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Prevent duplicate processing (React Strict Mode runs effects twice)
      if (oauthProcessedRef.current) {
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const platform = urlParams.get("platform");
      const error = urlParams.get("error");

      if (code && platform) {
        // Mark as processed immediately to prevent duplicate calls
        oauthProcessedRef.current = true;

        // Clear URL params immediately
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        try {
          console.log(`Processing ${platform} OAuth callback...`);
          if (platform === "tiktok") {
            await api.connectTikTok(code);
          } else if (platform === "linkedin") {
            await api.connectLinkedIn(code, true);
          }
          console.log(`${platform} connected successfully!`);
          // Reload accounts
          await loadAccounts();
        } catch (err) {
          console.error(`${platform} connection failed:`, err);
        }
      } else if (platform && error) {
        oauthProcessedRef.current = true;
        console.error(`${platform} OAuth error:`, error);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    };

    handleOAuthCallback();
  }, []);

  // Initialize Facebook SDK and check auth status on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Facebook SDK
        await initFacebookSDK();

        // Check if user has a token stored
        const token = api.getToken();
        if (token) {
          try {
            const response = await api.getCurrentUser();
            if (response.user) {
              setUser({
                id: response.user.id,
                email: response.user.email,
                name: response.user.name || response.user.email.split("@")[0],
              });
              setIsAuthenticated(true);

              // Load accounts and posts
              await Promise.all([loadAccounts(), loadPosts()]);
            }
          } catch (e) {
            // Token invalid, clear it
            api.setToken(null);
          }
        }
      } catch (error) {
        console.log("Init error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await api.getAccounts();
      const accounts: ConnectedAccount[] = response.accounts.map(
        (acc: any) => ({
          id: acc.id,
          platform: acc.platform as Platform,
          accountName: acc.accountName,
          isConnected: acc.isActive,
          lastActivity: acc.lastSyncedAt ? new Date(acc.lastSyncedAt) : null,
          avatar: acc.avatarUrl,
        })
      );

      // Get platforms that have at least one connected account
      const connectedPlatforms = new Set(accounts.map((a) => a.platform));

      // Add placeholder for platforms without any connected accounts
      const platforms: Platform[] = [
        "facebook",
        "instagram",
        "linkedin",
        "tiktok",
        "telegram",
      ];

      const placeholders = platforms
        .filter((platform) => !connectedPlatforms.has(platform))
        .map((platform) => ({
          id: `placeholder-${platform}`,
          platform,
          accountName:
            platform === "facebook"
              ? "Facebook Page"
              : platform === "instagram"
              ? "@instagram"
              : platform === "tiktok"
              ? "@tiktok"
              : platform === "telegram"
              ? "Telegram Channel"
              : "LinkedIn",
          isConnected: false,
          lastActivity: null,
        }));

      // Return all connected accounts + placeholders for unconnected platforms
      setConnectedAccounts([...accounts, ...placeholders]);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await api.getPosts();
      const loadedPosts: Post[] = response.posts.map((post: any) => ({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        platforms: post.platforms,
        createdAt: new Date(post.createdAt),
        status:
          post.postResults?.reduce((acc: any, pr: any) => {
            acc[pr.platform] =
              pr.status === "success"
                ? "success"
                : pr.status === "failed"
                ? "failed"
                : "pending";
            return acc;
          }, {}) || {},
        postUrls:
          post.postResults?.reduce((acc: any, pr: any) => {
            if (pr.platformPostUrl) acc[pr.platform] = pr.platformPostUrl;
            return acc;
          }, {}) || {},
        commentCount:
          post.postResults?.reduce(
            (sum: number, pr: any) => sum + (pr.commentsCount || 0),
            0
          ) || 0,
        likesCount:
          post.postResults?.reduce(
            (sum: number, pr: any) => sum + (pr.likesCount || 0),
            0
          ) || 0,
        sharesCount:
          post.postResults?.reduce(
            (sum: number, pr: any) => sum + (pr.sharesCount || 0),
            0
          ) || 0,
      }));
      setPosts(loadedPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  };

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const response = await api.login(email, password);

        if (response.user) {
          setUser({
            id: response.user.id,
            email: response.user.email,
            name: response.user.name || response.user.email.split("@")[0],
          });
          setIsAuthenticated(true);
          await Promise.all([loadAccounts(), loadPosts()]);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Login error:", error);
        return false;
      }
    },
    []
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name?: string
    ): Promise<boolean> => {
      try {
        await api.register(email, password, name);
        // Auto login after registration
        return await login(email, password);
      } catch (error) {
        console.error("Registration error:", error);
        return false;
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
    setConnectedAccounts([]);
    setPosts([]);
    setComments([]);
  }, []);

  const connectAccount = useCallback(
    async (platform: Platform): Promise<void> => {
      try {
        if (platform === "facebook" || platform === "instagram") {
          // Check if Facebook SDK is loaded
          if (!isFacebookSDKLoaded()) {
            throw new Error(
              "Facebook SDK not available. Please disable your ad blocker and refresh the page."
            );
          }

          // Use Facebook SDK for OAuth
          const fbResponse = await loginWithFacebook();

          // Send token to backend to connect pages
          const response = await api.connectFacebook(fbResponse.accessToken);
          console.log("Facebook pages connected:", response);

          // If Instagram, also try to connect Instagram accounts
          if (platform === "instagram") {
            try {
              await api.connectInstagram();
            } catch (e) {
              console.log("Instagram connection:", e);
            }
          }

          // Reload accounts
          await loadAccounts();
        } else if (platform === "tiktok") {
          // Get TikTok auth URL and redirect
          const { authUrl } = await api.getTikTokAuthUrl();
          window.location.href = authUrl;
        } else if (platform === "linkedin") {
          // Get LinkedIn auth URL and redirect
          const { authUrl } = await api.getLinkedInAuthUrl();
          window.location.href = authUrl;
        }
      } catch (error) {
        console.error(`Failed to connect ${platform}:`, error);
        throw error;
      }
    },
    []
  );

  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      await api.disconnectAccount(accountId);
      await loadAccounts();
    } catch (error) {
      console.error("Failed to disconnect account:", error);
    }
  }, []);

  const createPost = useCallback(
    async (
      content: string,
      imageUrl: string | null,
      platforms: Platform[]
    ): Promise<Post> => {
      try {
        const response = await api.createPost(
          content,
          platforms,
          imageUrl || undefined
        );

        const newPost: Post = {
          id: response.postId,
          content,
          imageUrl: imageUrl || undefined,
          platforms,
          createdAt: new Date(),
          status: response.results.reduce((acc: any, r: any) => {
            acc[r.platform] = r.success ? "success" : "failed";
            return acc;
          }, {}),
          postUrls: response.results.reduce((acc: any, r: any) => {
            if (r.postUrl) acc[r.platform] = r.postUrl;
            return acc;
          }, {}),
          commentCount: 0,
          likesCount: 0,
          sharesCount: 0,
        };

        setPosts((prev) => [newPost, ...prev]);

        // Auto-refresh engagement after a delay (Facebook API needs time)
        setTimeout(async () => {
          try {
            await api.refreshPostMetrics(newPost.id);
            await api.refreshPostComments(newPost.id);
            await loadPosts();
          } catch (e) {
            console.log("Auto-refresh after post failed:", e);
          }
        }, 30000); // 30 seconds delay

        // Second refresh after 2 minutes for slower engagement
        setTimeout(async () => {
          try {
            await api.refreshPostMetrics(newPost.id);
            await api.refreshPostComments(newPost.id);
            await loadPosts();
          } catch (e) {
            console.log("Auto-refresh after post failed:", e);
          }
        }, 120000); // 2 minutes delay

        return newPost;
      } catch (error) {
        console.error("Failed to create post:", error);
        throw error;
      }
    },
    []
  );

  const refreshComments = useCallback(async (): Promise<void> => {
    try {
      // Refresh comments and metrics for all recent posts
      const allComments: Comment[] = [];

      for (const post of posts.slice(0, 5)) {
        try {
          // Refresh both metrics and comments from platforms
          await Promise.all([
            api.refreshPostMetrics(post.id),
            api.refreshPostComments(post.id),
          ]);
          const response = await api.getPostComments(post.id);

          const postComments: Comment[] = response.comments.map((c: any) => ({
            id: c.id,
            postId: post.id,
            platform: c.platform as Platform,
            commenterName: c.commenterName,
            commenterAvatar: c.commenterAvatar,
            text: c.text,
            createdAt: new Date(c.commentedAt),
          }));

          allComments.push(...postComments);
        } catch (e) {
          console.log(`Failed to refresh comments for post ${post.id}:`, e);
        }
      }

      setComments(allComments);
      // Also reload posts to update engagement counts in the UI
      await loadPosts();
    } catch (error) {
      console.error("Failed to refresh comments:", error);
    }
  }, [posts]);

  const refreshAccounts = useCallback(async () => {
    await loadAccounts();
  }, []);

  const refreshPosts = useCallback(async () => {
    await loadPosts();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        connectedAccounts,
        posts,
        comments,
        isLoading,
        login,
        register,
        logout,
        connectAccount,
        disconnectAccount,
        createPost,
        refreshComments,
        refreshAccounts,
        refreshPosts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

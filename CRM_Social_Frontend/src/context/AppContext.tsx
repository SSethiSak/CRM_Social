import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import type {
  User,
  ConnectedAccount,
  Post,
  Comment,
  Platform,
} from "@/types/social";
import api from "@/lib/api";
import { initFacebookSDK, loginWithFacebook } from "@/lib/facebook";

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

      // Ensure all platforms are represented
      const platforms: Platform[] = ["facebook", "instagram", "linkedin"];
      const accountsWithAllPlatforms = platforms.map((platform) => {
        const existing = accounts.find((a) => a.platform === platform);
        if (existing) return existing;
        return {
          id: `placeholder-${platform}`,
          platform,
          accountName:
            platform === "facebook"
              ? "Facebook Page"
              : platform === "instagram"
              ? "@instagram"
              : "LinkedIn Company",
          isConnected: false,
          lastActivity: null,
        };
      });

      setConnectedAccounts(accountsWithAllPlatforms);
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
        } else if (platform === "linkedin") {
          // For LinkedIn, we'd need OAuth flow - for now show alert
          alert(
            "LinkedIn OAuth not yet implemented. Please add your LinkedIn access token manually."
          );
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
        };

        setPosts((prev) => [newPost, ...prev]);
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
      // Refresh comments for all recent posts
      const allComments: Comment[] = [];

      for (const post of posts.slice(0, 5)) {
        try {
          await api.refreshPostComments(post.id);
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

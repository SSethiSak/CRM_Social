// Facebook SDK Helper for OAuth

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const FACEBOOK_APP_ID =
  import.meta.env.VITE_FACEBOOK_APP_ID || "949297680764482";

let sdkLoadPromise: Promise<void> | null = null;
let sdkLoaded = false;
let sdkError: Error | null = null;

export function initFacebookSDK(): Promise<void> {
  // Return existing promise if already loading/loaded
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.FB) {
      sdkLoaded = true;
      resolve();
      return;
    }

    // Set a timeout for SDK loading
    const timeout = setTimeout(() => {
      sdkError = new Error("Facebook SDK failed to load (timeout or blocked)");
      console.warn(
        "Facebook SDK load timeout - it may be blocked by an ad blocker"
      );
      resolve(); // Resolve anyway to not block the app
    }, 5000);

    window.fbAsyncInit = function () {
      clearTimeout(timeout);
      try {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v21.0",
        });
        sdkLoaded = true;
        resolve();
      } catch (error) {
        sdkError = error as Error;
        console.error("Facebook SDK init error:", error);
        resolve(); // Resolve anyway to not block the app
      }
    };

    // Load the SDK asynchronously
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(timeout);
      sdkError = new Error(
        "Facebook SDK failed to load (network error or blocked)"
      );
      console.warn(
        "Facebook SDK failed to load - it may be blocked by an ad blocker"
      );
      resolve(); // Resolve anyway to not block the app
    };
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
}

export function isFacebookSDKLoaded(): boolean {
  return sdkLoaded && !!window.FB;
}

export function getFacebookSDKError(): Error | null {
  return sdkError;
}

export function loginWithFacebook(): Promise<{
  accessToken: string;
  userID: string;
}> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(
        new Error(
          "Facebook SDK not loaded. Please disable your ad blocker or try again later."
        )
      );
      return;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          // Log granted scopes for debugging
          console.log("Facebook login successful!");
          console.log("Granted scopes:", response.authResponse.grantedScopes);
          console.log("User ID:", response.authResponse.userID);

          resolve({
            accessToken: response.authResponse.accessToken,
            userID: response.authResponse.userID,
          });
        } else {
          reject(new Error("Facebook login cancelled or failed"));
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management",
        return_scopes: true,
        auth_type: "rerequest",
      }
    );
  });
}

export function getFacebookLoginStatus(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error("Facebook SDK not loaded"));
      return;
    }
    window.FB.getLoginStatus((response: any) => {
      resolve(response);
    });
  });
}

export function logoutFromFacebook(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      resolve(); // Just resolve if SDK not loaded
      return;
    }
    window.FB.logout(() => {
      resolve();
    });
  });
}

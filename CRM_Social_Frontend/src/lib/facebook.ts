// Facebook SDK Helper for OAuth

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const FACEBOOK_APP_ID =
  import.meta.env.VITE_FACEBOOK_APP_ID || "1898541347463021";

export function initFacebookSDK(): Promise<void> {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v19.0",
      });
      resolve();
    };

    // Load the SDK asynchronously
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
}

export function loginWithFacebook(): Promise<{
  accessToken: string;
  userID: string;
}> {
  return new Promise((resolve, reject) => {
    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
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
      }
    );
  });
}

export function getFacebookLoginStatus(): Promise<any> {
  return new Promise((resolve) => {
    window.FB.getLoginStatus((response: any) => {
      resolve(response);
    });
  });
}

export function logoutFromFacebook(): Promise<void> {
  return new Promise((resolve) => {
    window.FB.logout(() => {
      resolve();
    });
  });
}

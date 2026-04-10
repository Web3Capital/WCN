"use client";

import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function WeChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#07C160">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.92zm5.812 0a.96.96 0 0 1 0 1.92.96.96 0 0 1 0-1.92zm3.2 4.147c-3.894 0-7.048 2.553-7.048 5.708 0 3.154 3.154 5.708 7.048 5.708.87 0 1.713-.145 2.507-.396a.71.71 0 0 1 .543.07l1.453.848a.263.263 0 0 0 .124.04.222.222 0 0 0 .22-.223c0-.054-.02-.108-.036-.163l-.297-1.122a.48.48 0 0 1 .16-.508c1.418-1.07 2.322-2.67 2.322-4.454 0-3.154-3.152-5.708-6.996-5.708zm-2.065 3.242a.768.768 0 0 1 0 1.536.768.768 0 0 1 0-1.536zm4.13 0a.768.768 0 0 1 0 1.536.768.768 0 0 1 0-1.536z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

const OAUTH_PROVIDERS = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "azure-ad", label: "Microsoft", icon: MicrosoftIcon },
  { id: "apple", label: "Apple", icon: AppleIcon },
  { id: "github", label: "GitHub", icon: GitHubIcon },
  { id: "wechat", label: "WeChat", icon: WeChatIcon },
] as const;

export function OAuthButtons() {
  return (
    <div className="oauth-buttons">
      {OAUTH_PROVIDERS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`oauth-btn oauth-btn-${id}`}
          onClick={() => signIn(id, { callbackUrl: "/dashboard" })}
        >
          <span className="oauth-btn-icon"><Icon /></span>
          {label}
        </button>
      ))}
    </div>
  );
}

export function WalletLoginButton() {
  async function handleWalletLogin() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert("Please install a Web3 wallet (MetaMask, Rainbow, etc.) to continue.");
      return;
    }

    try {
      const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      if (!address) return;

      const nonceRes = await fetch("/api/auth/siwe");
      const { nonce } = await nonceRes.json();

      const message = [
        `${window.location.host} wants you to sign in with your Ethereum account:`,
        address,
        "",
        "Sign in to WCN",
        "",
        `URI: ${window.location.origin}`,
        `Version: 1`,
        `Chain ID: 1`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      const signature = await ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      const result = await signIn("wallet", {
        message,
        signature,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Wallet sign-in failed. Please try again.");
      }
    } catch (err: any) {
      if (err.code === 4001) return;
      console.error("Wallet login error:", err);
      alert("Wallet sign-in failed.");
    }
  }

  return (
    <button
      type="button"
      className="oauth-btn oauth-btn-wallet"
      onClick={handleWalletLogin}
    >
      <span className="oauth-btn-icon"><WalletIcon /></span>
      Wallet
    </button>
  );
}

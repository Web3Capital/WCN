"use client";

import { useState } from "react";
import { LoginForm } from "./ui";
import { PhoneLoginForm } from "./phone-form";
import { OAuthButtons, WalletLoginButton } from "./oauth-buttons";

type Tab = "social" | "email" | "phone" | "wallet";

const TABS: { id: Tab; label: string }[] = [
  { id: "social", label: "Social" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "wallet", label: "Wallet" },
];

export function LoginTabs() {
  const [tab, setTab] = useState<Tab>("social");

  return (
    <div>
      <div className="auth-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`auth-tab ${tab === t.id ? "auth-tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === "social" && <OAuthButtons />}

        {tab === "email" && <LoginForm />}

        {tab === "phone" && <PhoneLoginForm />}

        {tab === "wallet" && (
          <div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16, textAlign: "center" }}>
              Connect your Web3 wallet to sign in or create an account.
            </p>
            <WalletLoginButton />
          </div>
        )}
      </div>
    </div>
  );
}

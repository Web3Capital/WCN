import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "./ui";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Sign in</span>
        <h1>Welcome back.</h1>
        <div className="card" style={{ maxWidth: 520, marginTop: 18 }}>
          <LoginForm />
          <p className="muted" style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
            Don&apos;t have an account? <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}


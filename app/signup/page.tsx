import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "./ui";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Create account</span>
        <h1>Join WCN.</h1>
        <div className="card" style={{ maxWidth: 560, marginTop: 18 }}>
          <SignupForm />
        </div>
      </div>
    </main>
  );
}


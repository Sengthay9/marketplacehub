import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LoginForm from "@/features/auth/LoginForm";
import SiteLogo from "@/components/SiteLogo";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand Panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white">
        <div className="max-w-md">
          <div className="mb-3"><SiteLogo size={40} textClassName="text-4xl" /></div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Your marketplace,<br />your rules.
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Discover thousands of products from verified shops. Buy, sell, and grow — all in one place.
          </p>
          <div className="space-y-3">
            {["Shop from hundreds of verified stores", "Track every order in real-time", "Manage your shop with powerful tools", "Secure & trusted platform"].map((f) => (
              <div key={f} className="flex items-center gap-3 text-blue-100">
                <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link href="/" className="mb-2 lg:hidden block">
            <SiteLogo size={28} textClassName="text-2xl text-primary" />
          </Link>
          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your account</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

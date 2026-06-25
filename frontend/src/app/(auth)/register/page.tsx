import type { Metadata } from "next";
import RegisterForm from "@/features/auth/RegisterForm";
import Link from "next/link";
import SiteLogo from "@/components/SiteLogo";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <Link href="/" className="mb-1 inline-block"><SiteLogo size={32} textClassName="text-3xl text-primary" /></Link>
          <h2 className="text-xl font-bold mt-2">Create your account</h2>
          <p className="text-muted-foreground text-sm">Verify with Google or phone to get started</p>
        </div>
        <RegisterForm />
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Want to sell?{" "}
            <Link href="/vendor-register" className="text-primary font-medium hover:underline">Apply as a vendor</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

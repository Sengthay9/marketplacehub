import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import SetPasswordForm from "@/features/auth/SetPasswordForm";
import SiteLogo from "@/components/SiteLogo";

export const metadata: Metadata = { title: "Set Your Password" };

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><SiteLogo size={28} textClassName="text-2xl text-primary" /></Link>
          <div className="flex justify-center mt-4 mb-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">Set your password</h1>
          <p className="text-muted-foreground text-sm">
            Create a personal password to use next time you sign in.
          </p>
        </div>
        <div className="bg-card border rounded-2xl p-8">
          <SetPasswordForm />
        </div>
      </div>
    </div>
  );
}

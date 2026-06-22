import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CallbackHandler from "./CallbackHandler";

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="text-3xl font-black text-primary">🛍️ MarketplaceHub</div>
      <Suspense fallback={
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Completing sign-in…</span>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}

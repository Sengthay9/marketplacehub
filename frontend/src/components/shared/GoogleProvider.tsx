"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleProvider({ clientId, children }: { clientId: string; children: React.ReactNode }) {
  if (!clientId) return <>{children}</>;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}

import type { Metadata } from "next";
import { Inter, Noto_Sans_Khmer } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import GoogleProvider from "@/components/shared/GoogleProvider";
import QueryProvider from "@/components/shared/QueryProvider";
import CartSidebar from "@/features/cart/CartSidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ["khmer"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-khmer",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CamCart — Cambodia's Marketplace", template: "%s | CamCart" },
  description: "Cambodia's leading multi-vendor marketplace. Browse, buy, and sell with confidence.",
  keywords: ["Cambodia", "marketplace", "e-commerce", "buy", "sell", "CamCart"],
  openGraph: {
    type: "website",
    siteName: "CamCart",
    title: "CamCart — Browse. Buy. Sell.",
    description: "Cambodia's leading multi-vendor marketplace.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${notoSansKhmer.variable}`}>
      <body className="font-sans theme-transition">
        <GoogleProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <QueryProvider>
              {children}
              <CartSidebar />
              <Toaster richColors position="top-right" />
            </QueryProvider>
          </ThemeProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}

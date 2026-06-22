import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import QueryProvider from "@/components/shared/QueryProvider";
import CartSidebar from "@/features/cart/CartSidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "MarketplaceHub", template: "%s | MarketplaceHub" },
  description: "Multi-vendor marketplace — browse, buy, and sell with confidence.",
  openGraph: {
    type: "website",
    siteName: "MarketplaceHub",
    title: "MarketplaceHub — Browse. Buy. Sell.",
    description: "The multi-vendor marketplace for everyone.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            {children}
            <CartSidebar />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

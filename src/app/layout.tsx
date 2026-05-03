import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Douglas Landscaping Co.",
  description: "Landscaping business management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Douglas Lawn",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: { url: "/icon-512.svg" },
  },
};

export const viewport: Viewport = {
  themeColor: "#C9A96E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAF7]">
        <main
          className="max-w-lg mx-auto min-h-screen"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
        >
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}

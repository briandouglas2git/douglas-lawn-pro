import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Douglas Landscaping Co.",
  description: "Landscaping business management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f3f4f6]">
        <main className="pb-20 max-w-lg mx-auto min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}

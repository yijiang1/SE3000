import type { Metadata } from "next";
import "./globals.css";
import TeacherAccess from "@/components/TeacherAccess";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "SE 3000 — Special Education AI Materials & IEP Platform",
  description: "Local-first, AI-powered special education teaching materials generator and IEP goal progress tracker. Browser-local records; generation uses configured AI providers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-indigo-500 selection:text-white">
        <TeacherAccess>
          <TopNav />
          {children}
        </TeacherAccess>
      </body>
    </html>
  );
}

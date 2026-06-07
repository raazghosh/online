import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | SecureVote",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-6 text-white">
      {/* Background glows */}
      <div className="absolute top-[20%] left-[10%] w-[35vw] h-[35vw] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-accent/8 blur-[130px] pointer-events-none" />

      <div className="relative text-center space-y-8 max-w-md">
        <div className="space-y-2">
          <p className="text-7xl font-black text-primary/20 tracking-tight select-none">404</p>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            This route does not exist or you may not have access. Check the URL or return to the dashboard.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/feed"
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold hover:bg-white/10 transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface SiteLayoutProps {
  children: ReactNode;
  mainClassName?: string;
}

export function SiteLayout({ children, mainClassName = "" }: SiteLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white font-body selection:bg-primary/30 selection:text-primary">
      <Navbar />
      <main className={mainClassName}>{children}</main>
      <Footer />
    </div>
  );
}

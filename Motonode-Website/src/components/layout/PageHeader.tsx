import type { ReactNode } from "react";
import { FadeIn } from "@/components/animations/FadeIn";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <section className="relative pt-32 pb-16 md:pt-36 md:pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.14),transparent_48%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(39,39,42,0.6),transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn>
          {children}
          {eyebrow ? (
            <p className="text-primary uppercase tracking-[0.3em] text-xs font-semibold mb-4">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight mb-6 max-w-5xl">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl">
            {description}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

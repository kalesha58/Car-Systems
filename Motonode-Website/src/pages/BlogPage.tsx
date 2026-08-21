import { ArrowRight, CalendarDays, FileText, Wrench } from "lucide-react";
import { Link } from "wouter";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { sitePageMap } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const posts = [
  {
    title: "How to prepare your bike or car for seasonal servicing",
    excerpt:
      "A simple checklist for owners who want fewer workshop surprises and smoother maintenance planning.",
    icon: Wrench,
  },
  {
    title: "Choosing the right spare parts category before booking a service",
    excerpt:
      "Understand common categories like oils, tires, and brakes so you can plan service visits more confidently.",
    icon: FileText,
  },
  {
    title: "Why community-led ride planning makes journeys better",
    excerpt:
      "Discover how connected riders make group trips, stop planning, and preparedness feel much easier.",
    icon: CalendarDays,
  },
];

export default function BlogPage() {
  const page = sitePageMap.blog;

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        noindex
        structuredData={buildPageStructuredData("blog")}
      />

      <PageHeader
        eyebrow="Blog & Resources"
        title="Automobile guides, maintenance ideas, and platform insights"
        description="Use the Moto Node blog as a growing resource for service planning, parts discovery, community thinking, and smarter vehicle ownership habits."
      />

      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-3">
          {posts.map((post, index) => {
            const Icon = post.icon;

            return (
              <FadeIn key={post.title} delay={index * 0.08}>
                <article className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8 h-full flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-white mb-3">{post.title}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                  <span className="inline-flex items-center text-primary font-medium">
                    Coming soon in the Motonode app <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </section>

      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-10 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Want to turn readers into enquiries?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Pair blog content with service, parts, and partnership pages so search traffic has clear next steps across the site.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/services">Go to Services</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/parts">Browse Parts</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </SiteLayout>
  );
}

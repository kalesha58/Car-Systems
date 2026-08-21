import { PageHeader } from "@/components/layout/PageHeader";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { SEOHead } from "@/components/seo/SEOHead";
import { sitePageMap } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const termSections = [
  {
    title: "Using the platform",
    body:
      "By using Moto Node, you agree to use the website and related services lawfully, respectfully, and in ways that do not disrupt the platform or its users.",
  },
  {
    title: "Content and listings",
    body:
      "Moto Node may present services, business information, community content, and automobile-related listings for informational and discovery purposes. Availability and business terms may change over time.",
  },
  {
    title: "Partnership submissions",
    body:
      "When you submit business or dealer details through Moto Node, you confirm that the information provided is accurate and that you are authorised to share it.",
  },
  {
    title: "Changes to these terms",
    body:
      "Moto Node may update these terms from time to time. Continued use of the platform after updates means you accept the revised terms.",
  },
];

export default function TermsPage() {
  const page = sitePageMap.terms;

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("terms")}
      />

      <PageHeader
        eyebrow="Terms of Service"
        title="The core terms that apply to using Moto Node"
        description="These terms describe the general conditions for using the Moto Node website, contacting the team, and interacting with the platform experience."
      />

      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6">
          {termSections.map((section, index) => (
            <FadeIn key={section.title} delay={index * 0.08}>
              <article className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8">
                <h2 className="text-2xl font-display font-semibold text-white mb-4">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.body}</p>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

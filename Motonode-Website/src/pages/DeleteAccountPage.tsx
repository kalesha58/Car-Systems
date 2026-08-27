import { PageHeader } from "@/components/layout/PageHeader";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { SEOHead } from "@/components/seo/SEOHead";
import { siteConfig, sitePageMap } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const deletionMailto = `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent("Account Deletion Request")}`;

const sections = [
  {
    title: "Request deletion by email",
    body: (
      <>
        To request that your Motonode account and associated personal data are deleted, email{" "}
        <a className="text-primary underline underline-offset-2" href={deletionMailto}>
          {siteConfig.contact.email}
        </a>{" "}
        with the subject line <strong className="text-white">Account Deletion Request</strong> and include the
        registered email address or phone number for the account. We process requests within 30 days.
      </>
    ),
  },
  {
    title: "Delete from the Motonode app",
    body: (
      <>
        If you can still sign in, you can also delete your account in the app: customers use Settings; dealers
        use Privacy &amp; Security. Confirm the deletion prompt to permanently remove the account from active
        systems.
      </>
    ),
  },
  {
    title: "What we delete",
    body: (
      <>
        After we process your request, we delete or anonymize your profile and personal details from active
        systems. Some records may be kept where tax, accounting, dispute, fraud-prevention, or other legal
        rules require it.
      </>
    ),
  },
];

export default function DeleteAccountPage() {
  const page = sitePageMap["delete-account"];

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("delete-account")}
      />

      <PageHeader
        eyebrow="Account deletion"
        title="Request deletion of your Motonode account and data"
        description="Use this page to request that your Motonode account and associated personal data are deleted. You do not need to sign in to send a request."
      />

      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6">
          {sections.map((section, index) => (
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

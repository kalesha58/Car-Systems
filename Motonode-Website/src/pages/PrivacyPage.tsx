import { PageHeader } from "@/components/layout/PageHeader";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { SEOHead } from "@/components/seo/SEOHead";
import { siteConfig, sitePageMap } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const privacySections = [
  {
    title: "Who this policy covers",
    body:
      "This privacy policy applies to the Motonode website (motonode.in), the Motonode mobile apps for iOS and Android, and related customer and dealer services. Motonode is a marketplace that connects vehicle owners with independent dealers, workshops, and parts sellers in India.",
  },
  {
    title: "Account and contact information",
    body:
      "When you create an account we collect your name, email address, phone number, password (stored in hashed form), and whether you are a customer or a dealer. Dealers also provide business details such as workshop or store name, address, GST information, and identity or registration documents required for onboarding.",
  },
  {
    title: "Location",
    body:
      "With your permission, the app uses your location while it is in use to save delivery addresses, confirm a pin on the map for home-service bookings, show nearby workshops, and optionally tag a community post. We do not collect location when the app is in the background.",
  },
  {
    title: "Photos, camera and documents",
    body:
      "You may upload photos from your camera or photo library for garage vehicle records and RC documents, dealer registration, in-app chat attachments, and community posts. Those files are stored so we can show them to you and, where you have chosen to share them, to dealers or other users.",
  },
  {
    title: "Orders, bookings and payments",
    body:
      "We store order and booking history, vehicles you add to your garage, saved addresses, and messages exchanged with dealers. Payments for physical goods and workshop services are processed by our payment partners. We receive payment status and reference information; we do not store full card numbers. Payments are not processed as Apple In-App Purchases for those marketplace goods and services.",
  },
  {
    title: "Maps, notifications and other providers",
    body:
      "Address search and maps are provided by Google Maps. Push notifications and some operational analytics use Firebase (Google). These providers process data on our behalf to run the service. We do not sell personal information. We do not use the advertising identifier (IDFA) for tracking across other companies’ apps or websites.",
  },
  {
    title: "How we use information",
    body:
      "We use this information to operate accounts, fulfil orders and bookings, show maps and delivery options, send service notifications you opt into, prevent fraud, meet legal obligations, and improve the product. We do not use your data to serve third-party advertising in the app.",
  },
  {
    title: "Retention and account deletion",
    body:
      `We keep account and transaction records while your account is active and afterwards for as long as tax, accounting, dispute, or other legal rules require. In the Motonode app you can deactivate or permanently delete your account from Settings (customers) or Privacy & Security (dealers). You can also request deletion at ${siteConfig.url}/delete-account. Deletion removes your profile and personal details from active systems. Some records may be retained where the law requires us to keep them.`,
  },
  {
    title: "Your choices and contact",
    body:
      `You can update profile details in the app, manage notification preferences, and request support. For privacy questions, access requests, or deletion help, email ${siteConfig.contact.email} or write to Motonode support. Our public privacy page is ${siteConfig.url}/privacy.`,
  },
];

export default function PrivacyPage() {
  const page = sitePageMap.privacy;

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("privacy")}
      />

      <PageHeader
        eyebrow="Privacy Policy"
        title="How Motonode collects, uses, and deletes your information"
        description="This policy explains the data we handle in the Motonode apps and on motonode.in, including accounts, location, photos, maps, payments, and how you can delete your account."
      />

      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6">
          {privacySections.map((section, index) => (
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

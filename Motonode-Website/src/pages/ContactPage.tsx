import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone, HeadphonesIcon, Globe, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { FAQSection } from "@/components/seo/FAQSection";
import { SEOHead } from "@/components/seo/SEOHead";
import { BecomePartnerSection } from "@/components/sections/BecomePartnerSection";
import { ContactEnquiryForm } from "@/components/sections/ContactEnquiryForm";
import { siteConfig, sitePageMap, type FAQItem } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const whatsappHref = `https://wa.me/${siteConfig.contact.phoneE164.replace(/\D/g, "")}`;

const contactChannels = [
  {
    title: "Call Motonode",
    value: siteConfig.contact.phoneDisplay,
    href: `tel:${siteConfig.contact.phoneE164}`,
    icon: Phone,
  },
  {
    title: "Email Support",
    value: siteConfig.contact.email,
    href: `mailto:${siteConfig.contact.email}`,
    icon: Mail,
  },
  {
    title: "WhatsApp Enquiry",
    value: "Chat with the Motonode team",
    href: whatsappHref,
    icon: MessageCircle,
  },
  {
    title: "Corporate Office",
    value: `${siteConfig.contact.streetAddress}, ${siteConfig.contact.locality}, ${siteConfig.contact.region} ${siteConfig.contact.postalCode}`,
    href: "https://maps.google.com/?q=Hyderabad+Telangana+501505",
    icon: MapPin,
  },
];

const faqItems: FAQItem[] = [
  {
    question: "How can I contact Motonode for dealer partnerships?",
    answer:
      "Use the partnership form on this page or contact Motonode directly by phone, email, or WhatsApp for dealer and business conversations.",
  },
  {
    question: "Can I contact Motonode for service-related questions?",
    answer:
      "Yes. Motonode 24/7 support can be contacted for help around services, dealer support, emergency RSA, and general platform enquiries.",
  },
  {
    question: "Does Motonode support local business onboarding?",
    answer:
      "Yes. Local workshops, detailing studios, and authorized dealers can share their details through the partner application flow to join our premium network.",
  },
];

export default function ContactPage() {
  const page = sitePageMap.contact;
  const hoursLabel = `${siteConfig.supportHours.opens} – ${siteConfig.supportHours.closes}`;
  const daysLabel = "Monday – Saturday";

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("contact", { faqItems })}
      />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 overflow-hidden bg-background border-b border-border">
        {/* Background glow accents */}
        <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid gap-10 lg:grid-cols-12 lg:items-end">
          
          <div className="lg:col-span-7">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider mb-6">
                <HeadphonesIcon className="w-3.5 h-3.5" />
                <span>Contact Motonode</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-[1.15] mb-6 tracking-tight">
                Talk to the <br />
                <span className="text-primary">Motonode Team</span>
              </h1>
              
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Reach out for 24/7 premium support, service booking questions, or enterprise business partnerships. Phone, email, WhatsApp, or our direct enquiry form.
              </p>
            </FadeIn>
          </div>

          <div className="lg:col-span-5">
            <FadeIn delay={0.1}>
              <div className="flex flex-wrap gap-4 lg:justify-end">
                <div className="modern-card inline-flex items-center gap-3 rounded-full border border-border px-5 py-2.5 shadow-sm">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground leading-none mb-1">{hoursLabel}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-none">{daysLabel}</span>
                  </div>
                </div>
                <div className="modern-card inline-flex items-center gap-3 rounded-full border border-border px-5 py-2.5 shadow-sm">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground leading-none mb-1">Corporate HQ</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-none">
                      {siteConfig.contact.locality}, {siteConfig.contact.region}
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </section>

      {/* Main Contact Grid */}
      <section className="py-20 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-12 lg:items-start">
          
          {/* Enquiry Form */}
          <div className="lg:col-span-7">
            <FadeIn>
              <div className="rounded-[2.5rem] border border-border bg-card p-8 sm:p-12 shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-colors duration-500">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground text-[10px] font-black uppercase tracking-wider mb-4">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Direct Message</span>
                  </div>
                  <h2 className="text-3xl font-display font-extrabold text-foreground mb-3 tracking-tight">
                    Send us an Enquiry
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-10 leading-relaxed max-w-md">
                    Tell us what you need. We will open a secure WhatsApp thread with your details so our executive team can assist you immediately.
                  </p>
                  
                  {/* The form component itself needs to blend with the dark/light mode */}
                  <div className="contact-form-wrapper">
                    <ContactEnquiryForm />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Contact Channels */}
          <div className="lg:col-span-5">
            <FadeIn delay={0.1}>
              <div className="space-y-4">
                {contactChannels.map((channel) => {
                  const Icon = channel.icon;
                  const isExternal = channel.href.startsWith("http");

                  return (
                    <a
                      key={channel.title}
                      href={channel.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="group modern-card flex items-center gap-5 rounded-3xl p-6 hover:border-primary/60 transition-all duration-300 hover:shadow-xl"
                    >
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {channel.title}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium truncate">
                          {channel.value}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </a>
                  );
                })}
              </div>
            </FadeIn>
          </div>

        </div>
      </section>

      {/* For Workshops Section Label */}
      <section className="pt-20 pb-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>For Enterprise & Business</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold text-foreground mb-4 tracking-tight">
                Looking to join the <span className="text-primary">Premium Network?</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                The general enquiry form above is for customer support. The dedicated onboarding portal below is for verified independent workshops and premium dealers.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <BecomePartnerSection />

      <FAQSection
        title="Contact & Partnership FAQs"
        description="Common questions around getting in touch with the Motonode Executive Team."
        items={faqItems}
      />
    </SiteLayout>
  );
}

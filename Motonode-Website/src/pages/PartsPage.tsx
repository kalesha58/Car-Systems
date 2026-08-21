import { CheckCircle2, PackageCheck, Shield, Truck } from "lucide-react";
import { Link } from "wouter";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { FAQSection } from "@/components/seo/FAQSection";
import { SEOHead } from "@/components/seo/SEOHead";
import { Products } from "@/components/sections/Products";
import { Button } from "@/components/ui/button";
import { sitePageMap, type FAQItem } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const sellingPoints = [
  {
    title: "Verified Categories",
    description: "Explore oils, brakes, tires, accessories, and other essential vehicle parts in one place.",
    icon: PackageCheck,
  },
  {
    title: "Confidence in Quality",
    description: "Moto Node is designed to help customers find genuine products and trustworthy sellers faster.",
    icon: Shield,
  },
  {
    title: "Smoother Fulfilment",
    description: "Compare needs, prepare before service visits, and reduce delays in routine maintenance planning.",
    icon: Truck,
  },
];

const faqItems: FAQItem[] = [
  {
    question: "What types of spare parts can I explore on Moto Node?",
    answer:
      "Moto Node showcases common high-demand categories such as engine oil, brakes, tires, suspension needs, and interior accessories.",
  },
  {
    question: "Is Moto Node useful for both bikes and cars?",
    answer:
      "Yes. The platform is positioned as an automobile super app, so the parts and services experience is built for a wide range of vehicle owners.",
  },
  {
    question: "Can I combine parts discovery with service planning?",
    answer:
      "Yes. Moto Node is designed so parts, services, and dealer support work together, helping users prepare for maintenance more efficiently.",
  },
];

export default function PartsPage() {
  const page = sitePageMap.parts;

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("parts", {
          faqItems,
          productData: {
            name: "Automobile Spare Parts",
            description:
              "Moto Node helps users discover genuine automobile parts, verified categories, and smarter maintenance-ready purchases.",
          },
        })}
      />

      {/* Custom Modern Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(var(--primary-rgb),0.15),_transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeIn delay={0.1}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 ring-1 ring-primary/20 backdrop-blur-sm">
              Spare Parts
            </span>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 tracking-tight">
              Find the right parts <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">without the guesswork</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Moto Node brings popular parts categories, dealer support, and automobile convenience together so riders and drivers can buy smarter.
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="h-12 px-8 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-300">
                  Browse Categories
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-white/10 hover:bg-white/5 transition-all duration-300 backdrop-blur-sm">
                  View Offers
                </Button>
             </div>
          </FadeIn>

          <FadeIn delay={0.5} className="mt-16 md:mt-24 relative max-w-5xl mx-auto">
            {/* Ambient glow behind the image */}
            <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-3xl opacity-50" />
            
            <div className="relative rounded-3xl border border-white/10 overflow-hidden shadow-2xl group">
              {/* Overlay gradient to fade the bottom into the background */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10 pointer-events-none" />
              
              <img 
                src="/images/hero-parts.jpg" 
                alt="Premium automobile parts floating in a sleek studio setting" 
                className="w-full h-auto object-cover transform scale-100 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Glassmorphic Selling Points */}
      <section className="pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-3">
          {sellingPoints.map((item, index) => {
            const Icon = item.icon;

            return (
              <FadeIn key={item.title} delay={index * 0.1}>
                <article className="group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl p-8 h-full transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.03] hover:border-primary/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 ring-1 ring-primary/20 group-hover:ring-primary/50 transition-all duration-500 shadow-[0_0_15px_rgba(var(--primary),0.1)] group-hover:shadow-[0_0_25px_rgba(var(--primary),0.3)]">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-display font-semibold text-white mb-3 group-hover:text-primary transition-colors duration-300">{item.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </section>

      <Products />

      {/* Dynamic Split Layout Section */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <FadeIn direction="right">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-muted-foreground text-sm font-medium mb-6 ring-1 ring-white/10">
                  Smart Discovery
                </span>
                <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                  Why parts discovery matters on Moto Node
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Get the right parts before your service visit and make vehicle maintenance a seamless experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button asChild size="lg" className="rounded-full shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                    <Link href="/services">Explore Services</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full border-white/10 hover:bg-white/5 backdrop-blur-sm">
                    <Link href="/community">Join the Community</Link>
                  </Button>
                </div>
              </div>
            </FadeIn>
            
            <FadeIn direction="left" delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl blur-2xl opacity-50" />
                <div className="relative rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl p-8 shadow-2xl">
                  <div className="space-y-4">
                    {[
                      "Compare service readiness before visiting a workshop.",
                      "Discover fast-moving parts categories in one automobile-focused app.",
                      "Support vehicle upkeep with community and ride insights nearby.",
                      "Move from parts browsing to partnerships or service enquiries quickly.",
                    ].map((point, index) => (
                      <div key={index} className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-300">
                        <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-zinc-300 font-medium leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <FAQSection
        title="Spare Parts FAQs"
        description="Helpful answers for customers browsing products on Moto Node."
        items={faqItems}
      />
    </SiteLayout>
  );
}

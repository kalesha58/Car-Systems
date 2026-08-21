import { 
  ArrowRight, ShieldCheck, Bot, FileText, PhoneCall, 
  Car, Wrench, Package, Users, Building2, Smartphone, MessageSquare, Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { FAQSection } from "@/components/seo/FAQSection";
import { SEOHead } from "@/components/seo/SEOHead";
import { Services } from "@/components/sections/Services";
import { GarageFeatureSection } from "@/components/sections/GarageFeatureSection";
import { Button } from "@/components/ui/button";
import { sitePageMap, type FAQItem } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const faqItems: FAQItem[] = [
  {
    question: "What vehicle services can I book through Motonode?",
    answer:
      "Motonode supports comprehensive service categories including periodic maintenance, specialized motorcycle care, ceramic coating & detailing, 3D laser wheel alignment & tire replacement, ECU diagnostic scanning, battery replacement, and 24/7 roadside emergency assistance.",
  },
  {
    question: "How does the Motonode Garage feature simplify service bookings?",
    answer:
      "When you add your car or motorcycle to your Motonode Garage, your vehicle specifications, engine type, and digital glovebox documents (RC, Insurance, PUC) automatically filter compatible services and pre-fill booking details.",
  },
  {
    question: "Can I buy genuine spare parts on Motonode?",
    answer:
      "Yes. Our e-commerce marketplace allows you to find and buy genuine spare parts, riding gear, and accessories that are specifically compatible with the vehicles saved in your digital garage.",
  },
  {
    question: "How do the community and social features work?",
    answer:
      "The Motonode community hub lets you connect with other vehicle owners, post on social feeds, share ride experiences, and get live chat support and advice from both peers and professional mechanics.",
  },
  {
    question: "Can automotive dealers and workshops register on Motonode?",
    answer:
      "Yes. Workshops and parts dealers can register their business, manage inventory, identify their dealership tier, and sell products or services directly to the Motonode user base.",
  },
];

export default function ServicesPage() {
  const page = sitePageMap.services;

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("services", {
          faqItems,
        })}
      />

      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-background border-b border-border">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border backdrop-blur-md text-foreground text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(230,0,18,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>The Motonode Super App</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-foreground leading-[1.1] mb-6 tracking-tight max-w-5xl mx-auto">
              Everything your vehicle needs, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-500 to-orange-500 text-glow">
                in one executive platform
              </span>
            </h1>

            <p className="text-muted-foreground text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              From advanced garage tracking and genuine spare parts to a thriving social community and business dealer networks. Discover the complete Motonode ecosystem.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Button asChild size="lg" className="px-8 h-14 rounded-full font-bold shadow-[0_0_30px_rgba(230,0,18,0.3)] hover:shadow-[0_0_40px_rgba(230,0,18,0.5)] transition-all duration-300 text-base bg-primary hover:bg-primary/90 text-primary-foreground group">
                <a href="#garage">
                  Explore Ecosystem <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 1. My Garage Section (Using existing updated component) */}
      <div id="garage">
        <GarageFeatureSection />
      </div>

      {/* 2. Professional Services (The original booking features) */}
      <div id="booking" className="relative">
        <Services />
      </div>

      {/* 3. E-Commerce & Parts Section */}
      <section className="py-24 bg-background relative overflow-hidden text-foreground border-y border-border">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid gap-16 lg:grid-cols-2 items-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(230,0,18,0.15)]">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">E-Commerce Marketplace</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-foreground mb-6 leading-tight">
              Find and buy <span className="text-primary">genuine parts</span> mapped to your vehicle.
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed font-light">
              Stop guessing if a part fits. The Motonode marketplace reads your garage specs to only show you compatible engine oils, brake pads, riding gear, and accessories.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "100% Genuine OEM & OES spare parts",
                "Automated compatibility filtering based on your Garage",
                "Direct delivery or ship-to-workshop options",
                "Verified seller ratings and reviews"
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <Button asChild size="lg" className="px-8 h-14 rounded-full font-bold shadow-[0_0_30px_rgba(230,0,18,0.2)] bg-secondary/50 hover:bg-secondary/80 text-foreground border border-border backdrop-blur-md">
              <Link href="/parts">Browse Store</Link>
            </Button>
          </FadeIn>

          <FadeIn delay={0.2} className="relative">
            <div className="rounded-[2.5rem] border border-border bg-card/50 backdrop-blur-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src="/images/services-bike.png" 
                alt="Genuine parts e-commerce" 
                className="w-full h-[400px] object-cover rounded-3xl group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = "/images/community-hero.png" }}
              />
              {/* Floating Product Card */}
              <div className="absolute bottom-10 left-10 right-10 p-5 rounded-2xl bg-background/90 backdrop-blur-xl border border-border flex items-center gap-4 shadow-2xl z-10">
                <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                   <Package className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Motul 7100 4T 10W-50</h4>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold mb-1">✓ Verified Fit for BMW M4</p>
                  <span className="text-foreground font-bold">₹950.00</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 4. Community & Social Hub Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-16 lg:grid-cols-2 items-center">
          
          <FadeIn className="order-2 lg:order-1 relative">
            <div className="rounded-[2.5rem] border border-border bg-card shadow-2xl p-6 overflow-hidden group">
              <div className="relative h-[400px] w-full rounded-3xl overflow-hidden">
                <img 
                  src="/images/community-hero.png" 
                  alt="Motonode Community" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                
                {/* Floating Chat/Post UI */}
                <div className="absolute bottom-6 left-6 right-6 space-y-3 z-10">
                  <div className="p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border text-foreground shadow-xl ml-10">
                    <p className="text-xs text-muted-foreground mb-1">Mechanic Mike <span className="text-primary ml-2">✓ Pro</span></p>
                    <p className="text-sm font-medium">I'd recommend checking the O2 sensor based on that engine code.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/90 backdrop-blur-xl border border-primary text-primary-foreground shadow-xl mr-10">
                    <p className="text-xs text-primary-foreground/70 mb-1">You</p>
                    <p className="text-sm font-medium">Thanks! I'll order the part from the store and book a slot.</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Users className="w-3.5 h-3.5" />
              <span>Community & Social Hub</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-foreground mb-6 leading-tight">
              Connect with enthusiasts and <span className="text-primary">expert mechanics.</span>
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Motonode is more than utilities. It's a living social network. Post updates about your build, share photos of your rides, and get instant chat support from certified mechanics and fellow community members.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { title: "Social Media Feed", desc: "Post photos, mods, and stories.", icon: MessageSquare },
                { title: "Live Chat Support", desc: "Direct messaging with mechanics.", icon: Smartphone },
              ].map((item, i) => (
                <div key={i} className="modern-card p-5 rounded-2xl flex items-start gap-3 border-border/80">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="px-8 h-12 rounded-xl font-bold shadow-md">
              <Link href="/community">Join the Community <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* 5. Dealer & Business Network Section */}
      <section className="py-24 bg-background relative overflow-hidden text-foreground border-t border-border">
        <div className="absolute inset-0 bg-secondary/20 dark:bg-zinc-950 opacity-80 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(230,0,18,0.15)]">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">For Businesses & Workshops</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-display font-black text-foreground mb-6 leading-tight">
              Grow your business with the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-500 to-orange-500 text-glow">
                Motonode Dealer Network
              </span>
            </h2>
            
            <p className="text-muted-foreground text-lg sm:text-xl mb-12 leading-relaxed max-w-2xl mx-auto font-light">
              Workshops and product sellers can register as official Motonode Partners. Manage your inventory, identify your dealership tier, and sell services or genuine products directly to thousands of verified vehicle owners.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-left">
              {[
                { title: "Business Registration", desc: "Fast GST and identity verification onboarding." },
                { title: "Dealer Identification", desc: "Showcase your official partner badges & tier." },
                { title: "Product Selling", desc: "List and sell parts directly on the marketplace." }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border backdrop-blur-md hover:bg-secondary/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mb-4">
                    {i + 1}
                  </div>
                  <h4 className="font-bold text-foreground text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="px-8 h-14 rounded-full font-bold shadow-[0_0_30px_rgba(230,0,18,0.3)] bg-primary hover:bg-primary/90 text-primary-foreground group">
              <Link href="/contact">
                Register Your Business <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      <FAQSection
        title="Ecosystem FAQs"
        description="Everything you need to know about the Motonode Super App services."
        items={faqItems}
      />
    </SiteLayout>
  );
}

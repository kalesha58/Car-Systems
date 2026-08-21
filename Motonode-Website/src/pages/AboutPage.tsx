import {
  ArrowRight,
  Gauge,
  Globe,
  MapPin,
  MessageSquare,
  Package,
  ShieldCheck,
  Sparkles,
  Wrench,
  Activity,
  Users
} from "lucide-react";
import { Link } from "wouter";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { sitePageMap } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const stats = [
  { value: "4", label: "Platform pillars" },
  { value: "India", label: "First, by design" },
  { value: "Verified", label: "Workshop partners" },
  { value: "24/7", label: "Roadside care" },
];

const featuredPillar = {
  title: "One platform for automobile life",
  description:
    "Parts, services, community, and ride experiences belong together. Motonode brings every vehicle touchpoint into one unified executive application so owners stop jumping between disconnected tools.",
  icon: Sparkles,
};

const supportingPillars = [
  {
    title: "Built for India",
    description: "Designed around Indian riders, drivers, workshops, and dealers — from GST-ready onboarding to everyday service booking.",
    icon: Globe,
  },
  {
    title: "Trust-Driven Experience",
    description: "Verified partners and transparent discovery reduce the guesswork that usually comes with workshops, parts, and roadside help.",
    icon: ShieldCheck,
  },
  {
    title: "Faster Everyday Utility",
    description: "From maintenance planning to community walkie chats, Motonode is built to make routine vehicle decisions simpler and faster.",
    icon: Gauge,
  },
];

const platformGlance = [
  {
    title: "Vehicle Services",
    description: "Book verified workshops, diagnostics, detailing, and 24/7 roadside support.",
    href: "/services",
    icon: Wrench,
    image: "/images/services-hero.png"
  },
  {
    title: "Genuine Spare Parts",
    description: "Discover premium oils, brakes, tires, and accessories from trusted categories.",
    href: "/parts",
    icon: Package,
    image: "/images/services-bike.png"
  },
  {
    title: "Rider Community",
    description: "Meet fellow owners, share journeys, and stay close to local riding groups.",
    href: "/community",
    icon: MessageSquare,
    image: "/images/community-hero.png"
  },
  {
    title: "Ride Experiences",
    description: "Plan better trips with service readiness and group convoy coordination in one place.",
    href: "/rides",
    icon: MapPin,
    image: "/images/services-detailing.png"
  },
];

export default function AboutPage() {
  const page = sitePageMap.about;
  const FeaturedIcon = featuredPillar.icon;

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("about")}
      />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-background border-b border-border">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Text Content */}
            <div className="lg:col-span-6 text-center lg:text-left">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider mb-6">
                  <Activity className="w-3.5 h-3.5" />
                  <span>About Motonode</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-[1.15] mb-6 tracking-tight">
                  India&apos;s 1st <br />
                  <span className="text-primary">Automobile Super App</span>
                </h1>

                <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Built to simplify every vehicle touchpoint — from premium spare parts and verified garage services to community networking and highway ride readiness.
                </p>
              </FadeIn>

              {/* Action CTAs */}
              <FadeIn delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                  <Button asChild size="lg" className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold shadow-md cursor-pointer">
                    <Link href="/services">
                      Explore Services <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold cursor-pointer border-primary/40 text-primary hover:bg-primary/10">
                    <Link href="/contact">
                      Talk to the Team
                    </Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Social Proof Stats */}
              <FadeIn delay={0.3}>
                <div className="pt-6 border-t border-border/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">Verified</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Workshops</p>
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">Premium</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Parts Access</p>
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">24/7</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Roadside Care</p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-6">
              <FadeIn delay={0.2}>
                <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-2xl group flex justify-center items-center h-[400px] sm:h-[500px]">
                  <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                  <img
                    src="/images/app-mockup.png"
                    alt="Moto Node mobile app preview"
                    className="relative z-10 w-full max-w-[240px] sm:max-w-[300px] drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.src = "/images/community-hero.png";
                      e.currentTarget.className = "w-full h-full object-cover object-center brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700";
                      e.currentTarget.parentElement!.className = "relative rounded-3xl overflow-hidden border border-border bg-card shadow-2xl group h-[400px] sm:h-[500px]";
                    }}
                  />
                  {/* Floating Action Card */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 sm:p-5 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 text-white flex items-center justify-between gap-4 shadow-xl z-20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white">Built for India</h4>
                        <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3 text-primary" /> Unifying riders, drivers & shops
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* Mission Block - Made it Dark and Premium */}
      <section className="py-24 bg-[#09090b] text-slate-50 relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-zinc-950 opacity-80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/90 text-xs font-black uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(230,0,18,0.15)]">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Our Mission</span>
            </div>
            <blockquote className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.1] tracking-tight max-w-4xl mx-auto">
              One executive platform for parts, services, community, and rides — so <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-500 to-orange-500 text-glow">automobile life in India</span> finally lives in a single place.
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* Pillars Section - Redesigned to match Community features style */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Core Ecosystem</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground tracking-tight">
                Built around the way <br />
                <span className="text-primary">vehicle life actually works</span>
              </h2>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportingPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <FadeIn key={pillar.title} delay={index * 0.08}>
                  <div className="modern-card p-8 rounded-3xl group h-full flex flex-col hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground group-hover:border-primary/30 transition-colors">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why We Exist Section */}
      <section className="py-20 bg-background border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <FadeIn direction="right">
              <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl group">
                <img
                  src="/images/dealer-network.png"
                  alt="Moto Node dealer and workshop network across India"
                  className="w-full h-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-700 brightness-105 contrast-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/images/community-hero.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-xl">
                   <h4 className="font-bold text-lg mb-1">Nationwide Network</h4>
                   <p className="text-sm text-zinc-300">From Hyderabad outward, unifying the fragmented automotive space.</p>
                </div>
              </div>
            </FadeIn>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider mb-6">
                <Globe className="w-3.5 h-3.5" />
                <span>Why We Exist</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold text-foreground tracking-tight mb-6 leading-tight">
                Vehicle ownership should not feel this fragmented.
              </h2>
              <div className="space-y-5 text-muted-foreground text-base sm:text-lg leading-relaxed">
                <p>
                  Finding a trusted workshop, ordering the right part, storing RC and insurance, and staying close to fellow riders still lives across too many scattered places.
                </p>
                <p>
                  Motonode was built to close that gap — an executive super app where riders, drivers, workshops, and dealers share the same ecosystem, with verified identity and faster utility at the core.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Platform at a Glance - Redesigned like Community Trending Discussions */}
      <section className="py-24 bg-background relative overflow-hidden">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <span>Platform Ecosystem</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground tracking-tight">
                Everything connected, <br />
                <span className="text-primary">in one place</span>
              </h2>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformGlance.map((item, idx) => (
              <FadeIn key={item.title} delay={idx * 0.1}>
                <Link href={item.href} className="modern-card rounded-3xl overflow-hidden group flex flex-col justify-between h-full hover:shadow-2xl transition-all duration-300 border-border/80">
                  <div>
                    {/* Rich Thumbnail Header */}
                    <div className="relative h-40 w-full overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover brightness-105 contrast-105 group-hover:scale-110 transition-transform duration-700" 
                        onError={(e) => {
                          e.currentTarget.src = "/images/community-hero.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                      
                      {/* Top Icon Badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <div className="w-10 h-10 rounded-xl bg-primary/90 backdrop-blur-md text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <item.icon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2 flex items-center justify-between">
                        {item.title}
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

        </div>
      </section>

      {/* Cyber-Luxury CTA Banner - Already similar, keeping it aligned */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-[2.5rem] border border-primary/40 bg-zinc-950 text-white relative overflow-hidden shadow-2xl p-8 sm:p-14 text-center">
              
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20 brightness-75 blur-xs pointer-events-none"
                style={{ backgroundImage: "url('/images/hero-car.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/25 rounded-full blur-[140px] pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-black uppercase tracking-wider mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ready When You Are</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white mb-4 tracking-tight leading-tight">
                  Join India&apos;s Premium <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-400">Automotive Network</span>
                </h2>
                
                <p className="text-zinc-300 text-base sm:text-lg mb-8 leading-relaxed">
                  Start with verified services, browse premium parts, or contact Motonode about dealer and exclusive workshop partnerships.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="px-8 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_25px_rgba(230,0,18,0.4)] cursor-pointer">
                    <Link href="/services">
                      Explore Services <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="px-8 h-12 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md cursor-pointer">
                    <Link href="/contact">Contact the Team</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </SiteLayout>
  );
}

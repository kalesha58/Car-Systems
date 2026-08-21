import { Link } from "wouter";
import { 
  Compass, MapPin, ShieldAlert, Users, ArrowRight, 
  Sparkles, Calendar, Navigation, ShieldCheck, Trophy 
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { FAQSection } from "@/components/seo/FAQSection";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { sitePageMap, type FAQItem } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const ridePillars = [
  {
    title: "Pre-Ride Service Readiness",
    description: "Ensure your vehicle is 100% journey-ready with Motonode 40-point safety inspections, oil top-ups, and tire pressure checks.",
    icon: ShieldCheck,
    badge: "Pre-Ride Inspection",
  },
  {
    title: "GPS Live Convoy Tracking",
    description: "Stay in sync with your group convoy in real-time. Share live location checkpoints, fuel stops, and rest area alerts.",
    icon: Navigation,
    badge: "Real-Time Tracking",
  },
  {
    title: "Group Convoy Coordination",
    description: "Organize group rides effortlessly with automated headcount, route maps, lead/sweep rider assignments, and walkie channels.",
    icon: Users,
    badge: "Group Communication",
  },
  {
    title: "24/7 Emergency Safety Net",
    description: "Enjoy complete peace of mind on long highway trips with integrated Motonode 24/7 roadside assistance and towing dispatches.",
    icon: ShieldAlert,
    badge: "Emergency Support",
  },
];

const featuredExpeditions = [
  {
    title: "Western Ghats Coastal Highway Rally",
    type: "Scenic Highway Cruise",
    distance: "340 km • 2 Days",
    image: "/images/community-hero.png",
    date: "Next Saturday",
    registered: "42 Riders",
    location: "Mumbai - Goa Highway",
  },
  {
    title: "Superbike Weekend Breakfast Run",
    type: "Morning Speed Cruise",
    distance: "120 km • 4 Hours",
    image: "/images/services-bike.png",
    date: "This Sunday",
    registered: "28 Bikes",
    location: "Outer Ring Road",
  },
  {
    title: "Buddh International Circuit Track Day",
    type: "Closed Circuit Performance",
    distance: "Full Day Track Pass",
    image: "/images/services.png",
    date: "Nov 15, 2026",
    registered: "15 Supercars",
    location: "BIC Circuit, Greater Noida",
  },
];

const faqItems: FAQItem[] = [
  {
    question: "What are Motonode Ride Experiences?",
    answer:
      "Motonode Ride Experiences combine curated highway routes, group convoy coordination, pre-ride workshop inspections, and 24/7 roadside assistance into a unified automotive trip ecosystem.",
  },
  {
    question: "How do I join an upcoming group ride?",
    answer:
      "You can browse upcoming highway cruises, breakfast runs, and track days on the Motonode Mobile App. Simply tap 'Register' to join the convoy and access route maps.",
  },
  {
    question: "Is roadside assistance included during group expeditions?",
    answer:
      "Yes! Every official Motonode organized ride is backed by 24/7 roadside assistance support, on-site tire repair dispatches, and emergency flatbed towing.",
  },
];

export default function RidesPage() {
  const page = sitePageMap.rides;

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("rides", { faqItems })}
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
                  <Compass className="w-3.5 h-3.5" />
                  <span>Curated Highway Expeditions</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-[1.15] mb-6 tracking-tight">
                  Plan & Experience <br />
                  <span className="text-primary">Unforgettable Rides</span>
                </h1>

                <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Coordinate group cruises, track real-time convoy locations, link your Motonode Garage, and access 24/7 emergency support on every journey.
                </p>
              </FadeIn>

              {/* Action CTAs */}
              <FadeIn delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                  <Button asChild size="lg" className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold shadow-md cursor-pointer">
                    <Link href="/community">
                      Explore Expeditions <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold cursor-pointer">
                    <Link href="/services">
                      <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                      Pre-Ride Inspection
                    </Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Stats Bar */}
              <FadeIn delay={0.3}>
                <div className="pt-6 border-t border-border/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">500+</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Rides Completed</p>
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">15,000+</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Highway Km</p>
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">24/7</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">RSA Towing Net</p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-6">
              <FadeIn delay={0.2}>
                <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-2xl group">
                  <img
                    src="/images/community-hero.png"
                    alt="Motonode luxury highway expedition convoy"
                    className="w-full h-[400px] sm:h-[480px] object-cover object-center brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Floating Live Event Card */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 sm:p-5 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 text-white flex items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shrink-0">
                        <Navigation className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white">Coastal Highway Expedition</h4>
                        <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-primary" /> Next Saturday • 42 Convoy Vehicles
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="shrink-0 text-xs font-bold shadow-sm cursor-pointer">
                      <Link href="/community">View Convoy</Link>
                    </Button>
                  </div>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Expeditions Showcase */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5" />
                <span>Featured Journeys</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground tracking-tight">
                Upcoming <span className="text-primary">Ride Expeditions</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mt-3 leading-relaxed">
                Join organized group runs led by experienced road captains, supported by Motonode roadside care.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {featuredExpeditions.map((exp, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div className="modern-card rounded-3xl overflow-hidden group flex flex-col justify-between h-full hover:shadow-2xl transition-all duration-300">
                  <div>
                    {/* Thumbnail */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <img 
                        src={exp.image} 
                        alt={exp.title}
                        className="w-full h-full object-cover brightness-105 contrast-105 group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                      
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-primary text-primary-foreground shadow-md">
                          {exp.type}
                        </span>
                        <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary" /> {exp.location}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-3">
                        {exp.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> {exp.date}
                        </span>
                        <span>•</span>
                        <span>{exp.distance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 pt-0 flex items-center justify-between border-t border-border/60 mt-auto">
                    <div className="flex items-center gap-2 pt-4">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">{exp.registered}</span>
                    </div>
                    <Button asChild size="sm" variant="outline" className="font-bold cursor-pointer mt-4 border-primary/40 text-primary hover:bg-primary/10">
                      <Link href="/community">
                        Register Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-20 border-t border-border bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Complete Preparedness</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground tracking-tight">
                Build Every Ride on a <span className="text-primary">Stronger Foundation</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mt-3 leading-relaxed">
                From pre-ride garage checks to live GPS convoy tracking, Motonode keeps your journeys seamless.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ridePillars.map((pillar, index) => {
              const Icon = pillar.icon;

              return (
                <FadeIn key={pillar.title} delay={index * 0.08}>
                  <div className="modern-card p-6 rounded-3xl group h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300 shadow-sm">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
                          {pillar.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {pillar.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

        </div>
      </section>

      {/* Cyber-Luxury Glass CTA Banner */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-[2.5rem] border border-primary/40 bg-zinc-950 text-white relative overflow-hidden shadow-2xl p-8 sm:p-14 text-center">
              
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 brightness-75 blur-xs pointer-events-none"
                style={{ backgroundImage: "url('/images/community-hero.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/25 rounded-full blur-[140px] pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-black uppercase tracking-wider mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ready for the Open Highway?</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white mb-4 tracking-tight leading-tight">
                  Start Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-400">Automobile Journey</span>
                </h2>
                
                <p className="text-zinc-300 text-base sm:text-lg mb-8 leading-relaxed">
                  Download the Motonode Mobile App today to discover curated highway expeditions, track your convoy live, and ensure pre-ride service readiness.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="px-8 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_25px_rgba(230,0,18,0.4)] cursor-pointer">
                    <Link href="/community">
                      Join the Rider Network <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="px-8 h-12 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md cursor-pointer">
                    <Link href="/services">Book Pre-Ride Service</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <FAQSection
        title="Ride Experience FAQs"
        description="Helpful guidance around journeys, group rides, and trip readiness."
        items={faqItems}
      />
    </SiteLayout>
  );
}

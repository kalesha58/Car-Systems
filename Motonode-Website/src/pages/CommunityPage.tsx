import { Link } from "wouter";
import { 
  Users, MessageSquare, Route, ShieldCheck, ArrowRight, 
  Sparkles, Heart, MapPin, Calendar, Award, Compass 
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { FAQSection } from "@/components/seo/FAQSection";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { sitePageMap, type FAQItem } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const communityFeatures = [
  {
    title: "Connect with Local Enthusiasts",
    description: "Discover vehicle owners, car clubs, and rider crews in your city who share your passion for maintenance, mods, and road trips.",
    icon: Users,
    stats: "10k+ Members",
  },
  {
    title: "Live Forums & Garage Feeds",
    description: "Engage in real-time discussions, ask mechanic questions, share build logs, and get feedback from experienced drivers.",
    icon: MessageSquare,
    stats: "24/7 Active Feeds",
  },
  {
    title: "Curated Group Expeditions",
    description: "Participate in organized weekend highway cruises, track days, scenic mountain rallies, and local breakfast meetups.",
    icon: Route,
    stats: "500+ Rides Planned",
  },
  {
    title: "Verified Vehicle Credentials",
    description: "Showcase your Motonode Digital Garage with verified maintenance logs, service history badges, and modifications.",
    icon: ShieldCheck,
    stats: "Verified Badges",
  },
];

const trendingDiscussions = [
  {
    title: "Monsoon Superbike Ride to Western Ghats",
    category: "Weekend Expedition",
    image: "/images/services-bike.png",
    author: "Rohan V.",
    avatar: "https://i.pravatar.cc/80?img=11",
    likes: 248,
    comments: 42,
    location: "Western Ghats",
  },
  {
    title: "Stage 2 ECU Remap & Exhaust Upgrade Guide",
    category: "Mods & Performance",
    image: "/images/services.png",
    author: "Arjun M.",
    avatar: "https://i.pravatar.cc/80?img=12",
    likes: 312,
    comments: 89,
    location: "Bengaluru",
  },
  {
    title: "Top 5 Ceramic Coating Maintenance Tips for 2026",
    category: "Detailing & Care",
    image: "/images/services-detailing.png",
    author: "Sneha K.",
    avatar: "https://i.pravatar.cc/80?img=15",
    likes: 195,
    comments: 31,
    location: "Hyderabad",
  },
];

const faqItems: FAQItem[] = [
  {
    question: "What is the Motonode Community?",
    answer:
      "The Motonode Community is India's premier social network for automobile owners, riders, and car enthusiasts to connect, share maintenance tips, organize group rides, and showcase their digital garage.",
  },
  {
    question: "Can I join local riding groups in my city?",
    answer:
      "Yes! Motonode allows you to discover city-based riding clubs, weekend breakfast cruises, track day meetups, and local garage forums near you.",
  },
  {
    question: "How does Motonode verify community members?",
    answer:
      "Members can link their Motonode Digital Garage to verify vehicle ownership, service history, and official inspection records for complete trust.",
  },
];

export default function CommunityPage() {
  const page = sitePageMap.community;

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        structuredData={buildPageStructuredData("community", { faqItems })}
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
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rider & Car Club Network</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-[1.15] mb-6 tracking-tight">
                  India&apos;s Largest <br />
                  <span className="text-primary">Automobile Community</span>
                </h1>

                <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Connect with thousands of riders, drivers, and auto enthusiasts. Share build logs, coordinate weekend cruises, and explore trusted garage recommendations.
                </p>
              </FadeIn>

              {/* Action CTAs */}
              <FadeIn delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                  <Button asChild size="lg" className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold shadow-md cursor-pointer">
                    <Link href="/contact">
                      Join the Community <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold cursor-pointer">
                    <Link href="/rides">
                      <Compass className="w-4 h-4 mr-2" />
                      Explore Group Rides
                    </Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Social Proof Stats */}
              <FadeIn delay={0.3}>
                <div className="pt-6 border-t border-border/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">10,000+</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Active Members</p>
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">500+</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Rides Organized</p>
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">4.9★</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Rider Rating</p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-6">
              <FadeIn delay={0.2}>
                <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-2xl group">
                  <img
                    src="/images/community-hero.png"
                    alt="Motonode rider community expedition gathering"
                    className="w-full h-[400px] sm:h-[480px] object-cover object-center brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Floating Live Activity Card */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 sm:p-5 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 text-white flex items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2 shrink-0">
                        {[1, 2, 3].map((i) => (
                          <img
                            key={i}
                            src={`https://i.pravatar.cc/80?img=${i + 10}`}
                            alt="Community member avatar"
                            className="w-9 h-9 rounded-full border-2 border-black object-cover"
                          />
                        ))}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white">Upcoming Breakfast Cruise</h4>
                        <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-primary" /> This Sunday • 34 Registered
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="shrink-0 text-xs font-bold shadow-sm cursor-pointer">
                      <Link href="/rides">Join Ride</Link>
                    </Button>
                  </div>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <Award className="w-3.5 h-3.5" />
                <span>Community Ecosystem</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground tracking-tight">
                Built for <span className="text-primary">True Automobile Lovers</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mt-3 leading-relaxed">
                Connect with verified vehicle owners, participate in rides, and access community-recommended workshops.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {communityFeatures.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <FadeIn key={feature.title} delay={index * 0.08}>
                  <div className="modern-card p-6 rounded-3xl group h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300 shadow-sm">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
                          {feature.stats}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

        </div>
      </section>

      {/* Trending Community Discussions — Redesigned with Rich Image Thumbnails & Seamless Theme Blend */}
      <section className="py-20 bg-background border-t border-border relative overflow-hidden">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <span>Live Community Feeds</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground tracking-tight">
                Trending <span className="text-primary">Member Posts</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Button asChild variant="outline" className="font-bold cursor-pointer border-primary/40 text-primary hover:bg-primary/10">
                <Link href="/rides">
                  View All Activity <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {trendingDiscussions.map((disc, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div className="modern-card rounded-3xl overflow-hidden group flex flex-col justify-between h-full hover:shadow-2xl transition-all duration-300">
                  <div>
                    {/* Rich Thumbnail Header */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <img 
                        src={disc.image} 
                        alt={disc.title}
                        className="w-full h-full object-cover brightness-105 contrast-105 group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-primary text-primary-foreground shadow-md">
                          {disc.category}
                        </span>
                        <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary" /> {disc.location}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-3">
                        {disc.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-6 pt-0 flex items-center justify-between border-t border-border/60 mt-auto">
                    <div className="flex items-center gap-2.5 pt-4">
                      <img
                        src={disc.avatar}
                        alt={disc.author}
                        className="w-8 h-8 rounded-full object-cover border-2 border-primary/30"
                      />
                      <span className="text-xs font-bold text-foreground">{disc.author}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold pt-4">
                      <span className="flex items-center gap-1 text-rose-500">
                        <Heart className="w-3.5 h-3.5 fill-current" /> {disc.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" /> {disc.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

        </div>
      </section>

      {/* Cyber-Luxury Glass Banner CTA */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-[2.5rem] border border-primary/40 bg-zinc-950 text-white relative overflow-hidden shadow-2xl p-8 sm:p-14 text-center">
              
              {/* Background ambient glow + image backdrop */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 brightness-75 blur-xs pointer-events-none"
                style={{ backgroundImage: "url('/images/community-hero.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/25 rounded-full blur-[140px] pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-black uppercase tracking-wider mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Join 10,000+ Motonode Riders</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white mb-4 tracking-tight leading-tight">
                  Connect with India&apos;s <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-400">Rider Network</span>
                </h2>
                
                <p className="text-zinc-300 text-base sm:text-lg mb-8 leading-relaxed">
                  Download the Motonode Mobile App today to discover local motor clubs, link your digital garage, and join upcoming weekend rides.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="px-8 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_25px_rgba(230,0,18,0.4)] cursor-pointer">
                    <Link href="/rides">
                      Explore Upcoming Rides <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="px-8 h-12 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md cursor-pointer">
                    <Link href="/services">See Service Options</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <FAQSection
        title="Community FAQs"
        description="Quick answers about the rider and enthusiast side of Motonode."
        items={faqItems}
      />
    </SiteLayout>
  );
}

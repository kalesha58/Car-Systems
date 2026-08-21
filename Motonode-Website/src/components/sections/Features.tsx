import { FadeIn } from "@/components/animations/FadeIn";
import { 
  Wallet, Users, MessageSquare, 
  ShieldCheck, CalendarClock, PenTool, 
  Zap, CheckCircle, Smartphone 
} from "lucide-react";

const newFeatures = [
  { 
    icon: Wallet, 
    title: "Document Wallet & Glovebox", 
    desc: "Keep digital copies of your essential documents, like driving license, vehicle registration (RC), and pollution certificates (PUC), securely in your Garage." 
  },
  { 
    icon: Users, 
    title: "Enthusiast Groups & Community", 
    desc: "Build your network of fellow vehicle owners, join trip groups for weekend getaways, and share automotive stories." 
  },
  { 
    icon: MessageSquare, 
    title: "Connect & Communicate", 
    desc: "Direct message mechanics, dealers, and community members. Resolve vehicle questions or coordinate group rides seamlessly." 
  },
];

const originalFeatures = [
  { icon: ShieldCheck, title: "Verified Workshops", desc: "All service workshops are audited for quality, pricing, and authentic spare parts." },
  { icon: CalendarClock, title: "8-Step Guided Booking", desc: "Pick your preferred date, time slot, vehicle, and add-ons in seconds." },
  { icon: PenTool, title: "Genuine Spare Parts", desc: "100% authentic OEM and aftermarket spare parts with warranty." },
  { icon: Zap, title: "24/7 Roadside Care", desc: "Emergency battery jumpstarts, flat tire repair, and towing support." },
  { icon: CheckCircle, title: "Verified Dealers & Payouts", desc: "Dealer banking with inline GST verification and fast payouts." },
  { icon: Smartphone, title: "Digital Invoices & Records", desc: "Downloadable PDF service invoices and complete maintenance history." },
];

export function Features() {
  return (
    <section id="about" className="py-24 bg-background border-t border-border relative overflow-hidden scroll-mt-24">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <FadeIn>
            <div className="inline-flex items-center justify-center px-3.5 py-1 mb-4 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
              <span>Why Motonode</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Built for <span className="text-primary">Complete Vehicle Care</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Comprehensive features designed to enhance your vehicle ownership, garage management, and service experience.
            </p>
          </FadeIn>
        </div>

        {/* Highlighted 3 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-12">
          {newFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div className="bg-card border border-border p-8 rounded-3xl hover:border-primary/50 transition-all duration-300 group h-full flex flex-col relative overflow-hidden shadow-sm hover:shadow-md">
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-all duration-300 group-hover:scale-110 text-primary group-hover:text-primary-foreground">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* 6 Supporting Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {originalFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <FadeIn key={idx} delay={idx * 0.05 + 0.2}>
                <div className="bg-card border border-border p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 group h-full flex flex-col relative overflow-hidden shadow-sm hover:shadow-md">
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

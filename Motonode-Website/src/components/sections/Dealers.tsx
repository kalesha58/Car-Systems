import { FadeIn } from "@/components/animations/FadeIn";
import { Store, CheckCircle2 } from "lucide-react";

const dealerTypes = [
  "Automobile Dealers",
  "Bike Dealers",
  "Vehicle Wash Dealers",
  "Mechanical Workshops",
  "Detailing Centers",
  "Spare Parts Dealers",
  "Riding Gear Stores",
];

export function Dealers() {
  return (
    <section id="dealers" className="py-24 border-y border-border bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                <span>Verified Partner Network</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
                Our Verified <span className="text-primary">Dealer & Workshop Network</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
                We partner with top-rated mechanics and certified dealers. Every dealer on Motonode completes inline GST verification, shop photo audits, and automated bank payout setup.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dealerTypes.map((type, idx) => (
                <FadeIn key={idx} delay={idx * 0.05} direction="left">
                  <div className="flex items-center gap-3 bg-card border border-border p-4 rounded-xl hover:border-primary/50 transition-colors shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground font-medium text-sm">{type}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <div className="relative">
            <FadeIn delay={0.2} direction="right">
              <div className="relative rounded-3xl overflow-hidden border border-border aspect-[4/3] shadow-lg bg-card group">
                <img 
                  src="/images/dealer-network.png" 
                  alt="Verified Moto Node dealer workshop network" 
                  className="w-full h-full object-cover brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
                  width="2048"
                  height="2048"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-6 md:p-8">
                  <div className="glass-panel p-5 rounded-2xl border border-white/10 w-full backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md shrink-0 text-primary-foreground">
                        <Store className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-base md:text-lg">Elite Motors Workshop</h4>
                        <div className="flex items-center text-amber-400 text-xs mt-0.5">
                          ★★★★★ <span className="text-zinc-300 ml-2 font-medium">(4.9 Verified Review)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </div>
    </section>
  );
}

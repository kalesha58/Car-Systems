import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { Apple, Play } from "lucide-react";

export function AppPromo() {
  return (
    <section className="py-24 border-t border-border bg-background overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-card border border-border rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-xl">
          
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-full h-full bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="lg:w-1/2 relative z-10 text-center lg:text-left">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                <span>Mobile Super App</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
                Your Garage in your <span className="text-primary">Pocket</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
                Download the Motonode mobile app to access your digital glovebox, book vehicle services, track live mechanics, and join India&apos;s largest automotive community.
              </p>
              
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 gap-3 cursor-pointer shadow-md" onClick={() => window.open("https://apps.apple.com", "_blank")}>
                  <Apple className="w-6 h-6" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] leading-none font-normal">Download on the</span>
                    <span className="text-base leading-none font-semibold">App Store</span>
                  </div>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 gap-3 cursor-pointer border-border hover:bg-secondary" onClick={() => window.open("https://play.google.com/store/apps/details?id=com.motonode", "_blank")}>
                  <Play className="w-6 h-6 text-primary fill-primary" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] leading-none font-normal text-muted-foreground">GET IT ON</span>
                    <span className="text-base leading-none font-semibold text-foreground">Play Store</span>
                  </div>
                </Button>
              </div>
            </FadeIn>
          </div>

          <div className="lg:w-1/2 relative z-10 flex justify-center">
            <FadeIn delay={0.2} direction="up">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/15 blur-[60px] rounded-full -z-10" />
                <img 
                  src="/images/app-mockup.png" 
                  alt="Motonode mobile app preview for vehicle services and digital glovebox" 
                  className="w-full max-w-sm brightness-105 contrast-105 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                  width="420"
                  height="840"
                  loading="lazy"
                />
              </div>
            </FadeIn>
          </div>

        </div>
      </div>
    </section>
  );
}

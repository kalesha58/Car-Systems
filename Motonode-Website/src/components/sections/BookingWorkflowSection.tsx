import { Search, Calendar, Car, MapPin, PlusCircle, CheckCircle2, Navigation, FileCheck, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const bookingSteps = [
  { num: "01", title: "Select Service", desc: "Choose maintenance, detailing, repair, or OBD diagnostic care.", icon: Search },
  { num: "02", title: "Pick Date & Slot", desc: "Select convenient date & time slot for your appointment.", icon: Calendar },
  { num: "03", title: "Attach Vehicle", desc: "Select your vehicle directly from your Motonode Garage.", icon: Car },
  { num: "04", title: "Location & Pickup", desc: "Provide workshop location or doorstep pickup address.", icon: MapPin },
  { num: "05", title: "Add-on Options", desc: "Select optional sanitization, synthetic oil upgrade, or wiper check.", icon: PlusCircle },
  { num: "06", title: "Booking Summary", desc: "Review transparent quote breakdown and verified workshop details.", icon: CheckCircle2 },
  { num: "07", title: "Live Tracking", desc: "Track mechanic dispatch, service progress, and updates in real-time.", icon: Navigation },
  { num: "08", title: "Digital Invoice", desc: "Receive shareable, downloadable PDF service invoice upon completion.", icon: FileCheck },
];

export function BookingWorkflowSection() {
  return (
    <section className="py-20 sm:py-28 bg-background border-t border-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-extrabold uppercase tracking-wider mb-4">
              <span>End-to-End Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground mb-4 tracking-tight">
              8-Step Guided <span className="text-primary">Service Booking</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              From service selection to real-time tracking and official PDF invoices, Motonode keeps vehicle care completely seamless.
            </p>
          </FadeIn>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14 sm:mb-16">
          {bookingSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <FadeIn key={step.num} delay={idx * 0.04}>
                <div className="modern-card p-6 rounded-3xl group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-display font-black text-2xl text-muted-foreground/30 group-hover:text-primary transition-colors">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Digital Invoice Showcase Banner */}
        <FadeIn delay={0.2}>
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-xl">
            <div className="max-w-2xl">
              <span className="text-xs uppercase tracking-widest font-extrabold text-primary mb-2 block">
                Official Digital Documentation
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
                Downloadable PDF Invoices & Service Records
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Every service completed through Motonode generates an official itemized PDF invoice detailing labor, spare parts, taxes, and workshop warranty — easily downloadable and shareable.
              </p>
            </div>
            <Button asChild size="lg" className="px-8 h-12 rounded-xl font-bold shadow-md shrink-0 cursor-pointer w-full sm:w-auto">
              <Link href="/services">
                Book a Service Now <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}

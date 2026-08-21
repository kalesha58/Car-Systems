import { ShieldCheck, FileText, Smartphone, Car, CheckCircle2, ArrowRight, Lock, BellRing } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const garageFeatures = [
  {
    title: "Digital Vehicle Vault",
    desc: "Store RC Book, Insurance, PUC, and Driving License in an encrypted digital glovebox.",
    icon: FileText,
  },
  {
    title: "Instant Service Match",
    desc: "Automatically filter compatible engine oil, brake pads, and services for your exact model.",
    icon: Car,
  },
  {
    title: "Primary Vehicle Presets",
    desc: "Set your daily ride as primary to pre-fill booking forms with a single tap.",
    icon: Smartphone,
  },
  {
    title: "Document Expiry Alerts",
    desc: "Never miss renewals with automated reminder notifications for your documents.",
    icon: BellRing,
  },
];

export function GarageFeatureSection() {
  return (
    <section className="py-24 sm:py-32 bg-[#09090b] relative overflow-hidden text-slate-50 border-y border-white/5">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-70 animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-red-900/30 rounded-full blur-[100px] opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100px] bg-primary/10 blur-[80px] -rotate-45" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">
          
          {/* Left Feature Description */}
          <div className="lg:col-span-6">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(230,0,18,0.15)]">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-white/90">Garage & Digital Glovebox</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white mb-6 leading-[1.1] tracking-tight">
                Manage Your Vehicles in the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-500 to-orange-500 text-glow">
                  Digital Garage
                </span>
              </h2>

              <p className="text-slate-400 text-lg sm:text-xl mb-10 leading-relaxed max-w-xl font-light">
                Your dedicated Motonode hub. Store vehicle specs, manage digital documents with military-grade encryption, and book compatible services instantly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                {garageFeatures.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div key={feat.title} className="group p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-primary/50 transition-all duration-500 ease-out hover:-translate-y-1 shadow-lg">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center text-primary mb-4 border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-white text-lg mb-2">{feat.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                    </div>
                  );
                })}
              </div>

              <Button asChild size="lg" className="px-8 h-14 rounded-full font-bold shadow-[0_0_30px_rgba(230,0,18,0.3)] hover:shadow-[0_0_40px_rgba(230,0,18,0.5)] transition-all duration-300 text-base bg-primary hover:bg-primary/90 text-white cursor-pointer group">
                <Link href="/contact">
                  Explore Garage Features 
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </FadeIn>
          </div>

          {/* Right Card Mock Visual */}
          <div className="lg:col-span-6 relative">
            <FadeIn delay={0.2} className="relative z-10">
              <div className="relative rounded-[2.5rem] border border-white/10 bg-[#121214]/80 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                
                {/* Inner Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/20 blur-[60px] pointer-events-none" />

                <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20">
                      MN
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xl text-white tracking-tight">My Garage Hub</h4>
                      <p className="text-xs text-primary flex items-center gap-1.5 mt-1 font-semibold tracking-wide uppercase">
                        <Lock className="w-3.5 h-3.5" /> Encrypted Vault • 2 Vehicles
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </div>
                </div>

                {/* Simulated Vehicle Card */}
                <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 mb-8 shadow-inner overflow-hidden group hover:border-primary/40 transition-colors duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Car className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-lg text-white">BMW M4 Competition</span>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-primary text-white shadow-[0_0_15px_rgba(230,0,18,0.5)]">
                      Primary
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md group-hover:border-white/10 transition-colors">
                      <span className="block font-medium text-slate-400 text-xs mb-1 uppercase tracking-wider">Registration</span>
                      <span className="font-mono font-bold text-white text-sm">TS 09 AB 1234</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md group-hover:border-white/10 transition-colors">
                      <span className="block font-medium text-slate-400 text-xs mb-1 uppercase tracking-wider">Engine Spec</span>
                      <span className="font-bold text-white text-sm">3.0L Twin-Turbo</span>
                    </div>
                  </div>
                </div>

                {/* Document Checklist */}
                <h5 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 pl-1">
                  Digital Glovebox Vault
                </h5>
                <div className="space-y-3 relative z-10">
                  {[
                    { name: "RC Book Certificate", status: "Verified", date: "Expires 2035", icon: FileText },
                    { name: "Motor Insurance Policy", status: "Active", date: "Expires Nov 2026", icon: ShieldCheck },
                    { name: "PUC Certificate", status: "Valid", date: "Expires Jan 2027", icon: CheckCircle2 },
                  ].map((doc) => (
                    <div key={doc.name} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors text-slate-400">
                          <doc.icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors">{doc.name}</span>
                      </div>
                      <span className="text-slate-500 text-xs font-medium bg-black/30 px-3 py-1.5 rounded-full border border-white/5 self-start sm:self-auto">{doc.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Floating Elements for Depth */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-[40px] animate-pulse pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] animate-pulse delay-700 pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wrench, Bike, Droplets, Disc, BatteryCharging, ShieldAlert, Bot, 
  ArrowRight, CheckCircle2, Sparkles, Car 
} from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export interface ServiceCategoryItem {
  id: string;
  title: string;
  badge: string;
  icon: any;
  image: string;
  type: "car" | "bike" | "all" | "emergency";
  desc: string;
  features: string[];
}

export const fullServiceList: ServiceCategoryItem[] = [
  {
    id: "maintenance",
    title: "Periodic Maintenance & General Care",
    badge: "Most Popular",
    icon: Wrench,
    image: "/images/services.png",
    type: "all",
    desc: "Complete engine oil change, oil filter replacement, spark plug cleaning, brake pad check, and multi-point vehicle health scan.",
    features: ["Synthetic/Semi-Synthetic Oil Upgrade", "40-Point Safety Inspection", "Fluid Level Top-up", "Air & Cabin Filter Cleaning"],
  },
  {
    id: "bike-care",
    title: "Specialized Bike Care & Tuning",
    badge: "Bikes & Superbikes",
    icon: Bike,
    image: "/images/services-bike.png",
    type: "bike",
    desc: "Comprehensive motorcycle servicing, drive chain lubrication & tensioning, carburetor/FI tuning, and suspension inspection.",
    features: ["Chain Cleaning & Lube", "Brake Bleeding & Pad Replacement", "FI Diagnostics & ECU Check", "Engine Tuning"],
  },
  {
    id: "detailing",
    title: "Car Wash, Detailing & Ceramic Coating",
    badge: "Premium Polish",
    icon: Droplets,
    image: "/images/services-detailing.png",
    type: "car",
    desc: "Exterior pressure foam wash, interior deep vacuuming, leather conditioning, paint restoration, and multi-layer ceramic protection.",
    features: ["High-Pressure Foam Wash", "Interior Steam Sanitization", "Paint Correction & Polish", "9H Ceramic Coating Option"],
  },
  {
    id: "tires",
    title: "Tires, Laser Alignment & Balancing",
    badge: "Wheel Care",
    icon: Disc,
    image: "/images/services-tires.png",
    type: "all",
    desc: "Computerized 3D wheel alignment, wheel balancing, tire rotation, nitrogen air inflation, and genuine tire replacement.",
    features: ["3D Laser Wheel Alignment", "Dynamic Wheel Balancing", "Nitrogen Inflation", "Puncture Repair & Replacement"],
  },
  {
    id: "battery",
    title: "Battery, Electrical & ECU Diagnostics",
    badge: "Electrical Care",
    icon: BatteryCharging,
    image: "/images/services-ai.png",
    type: "all",
    desc: "Advanced OBD-II computer diagnostic scan, battery voltage test, alternator testing, and complete wiring fault rectification.",
    features: ["OBD-II Fault Scanning", "Battery Load Testing & Replacement", "Alternator & Starter Repair", "Fuse Box Diagnostics"],
  },
  {
    id: "emergency",
    title: "Roadside Assistance & Breakdown Care",
    badge: "24/7 Urgent",
    icon: ShieldAlert,
    image: "/images/services-emergency.png",
    type: "emergency",
    desc: "Immediate roadside breakdown support, emergency battery jumpstart, flat tire repair, and flatbed towing to nearest partner workshop.",
    features: ["Emergency Battery Jumpstart", "On-site Flat Tire Fix", "Flatbed Towing Support", "Emergency Fuel Delivery"],
  },
  {
    id: "ai-diagnostics",
    title: "Moto AI Smart Diagnostics & Fault Scan",
    badge: "AI Powered",
    icon: Bot,
    image: "/images/services-ai.png",
    type: "all",
    desc: "Leverage Moto AI companion to scan diagnostic trouble codes (DTC), receive instant repair cost estimates, and plan maintenance.",
    features: ["AI Diagnostic Code Translation", "Instant Cost Estimator", "Predictive Maintenance", "Smart Garage Integration"],
  },
];

export function Services() {
  const [activeFilter, setActiveFilter] = useState<"all" | "car" | "bike" | "emergency">("all");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("maintenance");

  const filteredServices = fullServiceList.filter((service) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "car") return service.type === "car" || service.type === "all";
    if (activeFilter === "bike") return service.type === "bike" || service.type === "all";
    if (activeFilter === "emergency") return service.type === "emergency" || service.badge.includes("Urgent");
    return true;
  });

  const activeService = fullServiceList.find((s) => s.id === selectedServiceId) || filteredServices[0] || fullServiceList[0];

  const handleFilterChange = (filterId: "all" | "car" | "bike" | "emergency") => {
    setActiveFilter(filterId);
    if (filterId === "car") {
      setSelectedServiceId("detailing");
    } else if (filterId === "bike") {
      setSelectedServiceId("bike-care");
    } else if (filterId === "emergency") {
      setSelectedServiceId("emergency");
    } else {
      setSelectedServiceId("maintenance");
    }
  };

  return (
    <section id="services" className="py-16 sm:py-24 border-y border-border bg-background relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/3 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/50 border border-border text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_10px_rgba(230,0,18,0.1)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Automotive Service Hub</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground tracking-tight">
              Comprehensive <span className="text-primary">Vehicle Services</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mt-3 leading-relaxed">
              Book verified workshops, doorstep care, and Moto AI diagnostic support directly through Motonode.
            </p>
          </FadeIn>

          {/* Filter Tabs with Category Icons */}
          <FadeIn delay={0.1}>
            <div className="w-full lg:w-auto overflow-x-auto hide-scrollbar pb-2 lg:pb-0">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-secondary/50 border border-border backdrop-blur-md min-w-max shadow-lg">
                {[
                  { id: "all", label: "All Services", icon: Sparkles },
                  { id: "car", label: "Car Services", icon: Car },
                  { id: "bike", label: "Bike Services", icon: Bike },
                  { id: "emergency", label: "Emergency Care", icon: ShieldAlert },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleFilterChange(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(230,0,18,0.3)] scale-105"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Dynamic Spotlight Visual & Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-12 items-stretch">
          
          {/* Left Dynamic Spotlight Image Card */}
          <div className="lg:col-span-5">
            <FadeIn className="h-full">
              <div className="relative group h-full rounded-[2.5rem] overflow-hidden border border-border bg-card shadow-2xl flex flex-col justify-end min-h-[380px] sm:min-h-[440px]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeService.image}
                    src={activeService.image}
                    alt={`${activeService.title} by Motonode`}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full object-cover object-center brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>
            </FadeIn>
          </div>

          {/* Right Top 4 Interactive Service Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {filteredServices.slice(0, 4).map((item, index) => {
              const Icon = item.icon;
              const isSelected = selectedServiceId === item.id;
              return (
                <FadeIn key={item.id} delay={0.06 * index}>
                  <div
                    onClick={() => setSelectedServiceId(item.id)}
                    className={`p-5 sm:p-6 rounded-[2rem] group flex flex-col justify-between h-full cursor-pointer transition-all duration-300 border ${
                      isSelected
                        ? "border-primary/50 ring-2 ring-primary/20 bg-primary/5 shadow-[0_0_20px_rgba(230,0,18,0.1)] scale-[1.02] backdrop-blur-md"
                        : "border-border bg-card hover:bg-secondary/30 hover:border-border/80 backdrop-blur-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                          isSelected ? "bg-primary text-primary-foreground scale-110 shadow-[0_0_15px_rgba(230,0,18,0.4)]" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_15px_rgba(230,0,18,0.3)]"
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                      {item.features.slice(0, 2).map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>

        {/* Remaining Services Grid */}
        {filteredServices.length > 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredServices.slice(4).map((item, index) => {
              const Icon = item.icon;
              const isSelected = selectedServiceId === item.id;
              return (
                <FadeIn key={item.id} delay={0.06 * index}>
                  <div
                    onClick={() => setSelectedServiceId(item.id)}
                    className={`p-6 rounded-[2rem] group flex flex-col justify-between h-full cursor-pointer transition-all duration-300 border ${
                      isSelected
                        ? "border-primary/50 ring-2 ring-primary/20 bg-primary/5 shadow-[0_0_20px_rgba(230,0,18,0.1)] scale-[1.02] backdrop-blur-md"
                        : "border-border bg-card hover:bg-secondary/30 hover:border-border/80 backdrop-blur-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                          isSelected ? "bg-primary text-primary-foreground scale-110 shadow-[0_0_15px_rgba(230,0,18,0.4)]" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_15px_rgba(230,0,18,0.3)]"
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                      {item.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

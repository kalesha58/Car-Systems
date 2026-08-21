import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Building2, CreditCard } from "lucide-react";

const steps = [
  { num: "01", title: "Register Account", desc: "Create your dealer or workshop profile." },
  { num: "02", title: "Shop Info & Banner", desc: "Upload workshop cover photo, operating hours & location." },
  { num: "03", title: "GST Verification", desc: "Inline GST number verification & PAN upload." },
  { num: "04", title: "Payout Account", desc: "Configure Bank account or UPI handle for direct fast payouts." },
  { num: "05", title: "Admin Review", desc: "Our team verifies business credentials and credentials." },
  { num: "06", title: "Go Live", desc: "List services, receive customer bookings & start earning." },
];

export function BecomePartnerSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    businessName: "",
    businessDescription: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = `*Partnership Application*%0A%0A` +
      `*Full Name:* ${formData.fullName}%0A` +
      `*Email:* ${formData.email}%0A` +
      `*Mobile Number:* ${formData.mobileNumber}%0A` +
      `*Business Name:* ${formData.businessName}%0A` +
      `*Business Description:* ${formData.businessDescription}`;
    
    window.open(`https://wa.me/919573759696?text=${message}`, "_blank");
  };

  const scrollToForm = () => {
    const formElement = document.getElementById("partnership-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="become-partner" className="py-24 bg-background border-t border-border relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full -mr-16 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Step Flow (1-6) */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="px-3.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/30 mb-4 inline-block">
                Dealer & Workshop Onboarding
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight text-foreground">
                How to Become a Verified <span className="text-primary">Dealer Partner</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Streamlined 6-step onboarding with inline GST verification, store photo setup, and automated fast payouts.
              </p>
            </motion.div>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2">
              <div className="h-full bg-gradient-to-r from-primary/30 via-primary to-primary/30 w-full opacity-60" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="relative z-10"
                >
                  <div className="flex flex-col items-center text-center group p-5 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/50 transition-all h-full">
                    <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-lg font-display font-bold text-foreground mb-4 group-hover:border-primary group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                      {step.num}
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="text-base px-8 h-12 rounded-xl font-bold shadow-md cursor-pointer" onClick={scrollToForm}>
              Become a Dealer Partner Now
            </Button>
          </div>
        </div>

        {/* Dealer Ecosystem Advantages */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h3 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">
              Why Workshops & Dealers Choose Motonode
            </h3>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Built with dedicated dealer banking, verified customer leads, and zero hassle payout management.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Inline GST & Verified Badge",
                description: "Automatic GST validation builds customer trust and unlocks official verified workshop branding.",
                icon: Building2
              },
              {
                title: "Dealer Bank & Fast Payouts",
                description: "Direct bank account & UPI setup ensures instant payouts upon service completion.",
                icon: CreditCard
              },
              {
                title: "Higher Service Volume",
                description: "Get discovered by vehicle owners seeking doorstep maintenance, detailing, and OBD diagnostics.",
                icon: Zap
              }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <motion.div 
          id="partnership-form"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto p-8 md:p-12 rounded-3xl bg-card border border-border shadow-xl relative scroll-mt-32"
        >
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-3xl -z-10" />
          
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-display font-bold mb-3 text-foreground">Partner Application Form</h3>
            <p className="text-muted-foreground text-sm">Fill out the details below to initiate instant onboarding via WhatsApp.</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full h-12 bg-background border border-border text-foreground rounded-xl px-4 focus:border-primary outline-none transition-all focus:ring-1 focus:ring-primary/30" 
                  placeholder="Enter your name" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full h-12 bg-background border border-border text-foreground rounded-xl px-4 focus:border-primary outline-none transition-all focus:ring-1 focus:ring-primary/30" 
                  placeholder="work@email.com" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Mobile Number</label>
                <input 
                  type="tel" 
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                  className="w-full h-12 bg-background border border-border text-foreground rounded-xl px-4 focus:border-primary outline-none transition-all focus:ring-1 focus:ring-primary/30" 
                  placeholder="Enter mobile number" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Business Name</label>
                <input 
                  type="text" 
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="w-full h-12 bg-background border border-border text-foreground rounded-xl px-4 focus:border-primary outline-none transition-all focus:ring-1 focus:ring-primary/30" 
                  placeholder="Enter shop / workshop name" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Business Description & Services Offered</label>
              <textarea 
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleChange}
                required
                className="w-full h-28 bg-background border border-border text-foreground rounded-xl p-4 focus:border-primary outline-none transition-all focus:ring-1 focus:ring-primary/30 resize-none" 
                placeholder="Briefly describe your vehicle servicing, workshop capabilities, or spare parts..." 
              />
            </div>
            <Button type="submit" className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-md transition-all cursor-pointer">
              Submit & Message on WhatsApp <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
        </motion.div>

      </div>
    </section>
  );
}

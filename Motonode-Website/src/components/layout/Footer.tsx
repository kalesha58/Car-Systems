import { Link } from "wouter";
import { Instagram, Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-20 pb-10 relative overflow-hidden">
      {/* Subtle glow in background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
              <img 
                src="/images/logo-icon.png" 
                alt="Motonode App Logo" 
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 filter drop-shadow-sm"
                width="48"
                height="48"
              />
              <span className="font-display font-black text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                Moto<span className="text-primary">Node</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              India&apos;s 1st Automobile Super App connecting vehicle owners with services, spare parts, dealer support, and rider community experiences.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Instagram, href: siteConfig.sameAs[0], label: "Instagram" },
                { Icon: Mail, href: `mailto:${siteConfig.contact.email}`, label: "Email" },
                { Icon: Phone, href: `tel:${siteConfig.contact.phoneE164}`, label: "Call" },
                { Icon: MessageCircle, href: "https://wa.me/919573759696", label: "WhatsApp" },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={item.label}
                  className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all hover:-translate-y-1"
                >
                  <item.Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-foreground font-display font-bold text-lg mb-6">Explore</h3>
            <ul className="space-y-3.5">
              {[
                { label: "Vehicle Services", href: "/services" },
                { label: "Spare Parts", href: "/parts" },
                { label: "Rider Community", href: "/community" },
                { label: "Ride Experiences", href: "/rides" },
                { label: "Automobile Blog", href: "/blog" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary text-sm transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-foreground font-display font-bold text-lg mb-6">Company</h3>
            <ul className="space-y-3.5">
              {[
                { label: "Become a Partner", href: "/contact" },
                { label: "Become a Dealer", href: "/contact" },
                { label: "About Moto Node", href: "/about" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Delete Account", href: "/delete-account" },
                { label: "Terms of Service", href: "/terms" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-foreground font-display font-bold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Hyderabad, Telangana 501505</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href={`tel:${siteConfig.contact.phoneE164}`} className="hover:text-primary transition-colors">
                  {siteConfig.contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-primary transition-colors">
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs md:text-sm">
            © {new Date().getFullYear()} MotoNode Automobile Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

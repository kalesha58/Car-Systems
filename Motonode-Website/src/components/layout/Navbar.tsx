import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { primaryNavigation } from "@/config/site";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const isHomePage = location === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navLinks = primaryNavigation.filter((page) =>
    ["home", "services", "parts", "community", "rides", "about", "contact"].includes(page.key),
  );

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }

    return location.startsWith(path);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage
          ? isScrolled
            ? "bg-background/90 dark:bg-black/90 backdrop-blur-md border-b border-border shadow-sm dark:shadow-none py-2"
            : "bg-transparent py-6"
          : "bg-background/95 dark:bg-black/95 backdrop-blur-md border-b border-border py-2"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link 
            href="/" 
            onClick={() => {
              closeMobileMenu();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <img 
              src="/images/logo-icon.png" 
              alt="Motonode App Logo" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 filter drop-shadow-sm"
              width="48"
              height="48"
            />
            <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              Moto<span className="text-primary">Node</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.path}
                className={`text-sm font-medium transition-all relative ${
                  isActive(link.path)
                    ? "text-primary font-semibold scale-105" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.navLabel}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Button asChild>
              <Link href="/contact">Become a Partner</Link>
            </Button>
          </div>

          {/* Mobile Menu Controls */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              className="p-2 text-foreground rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 dark:bg-black/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.path}
                  onClick={closeMobileMenu}
                  className={`text-lg font-medium text-left p-2 transition-colors ${
                    isActive(link.path)
                      ? "text-primary bg-primary/10 rounded-lg font-semibold" 
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {link.navLabel}
                </Link>
              ))}
              <div className="w-full h-px bg-border my-2" />
              <Button asChild className="w-full justify-center">
                <Link href="/contact" onClick={closeMobileMenu}>
                  Become a Partner
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


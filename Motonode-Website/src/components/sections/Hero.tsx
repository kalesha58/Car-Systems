import { motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

function AnimatedCar() {
  const RED = "#E60012";
  const carImage = "/images/cars/lamborghini-45deg.png";

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Rotating outer halos */}
      <motion.div
        className="absolute"
        style={{ width: "95%", aspectRatio: "1" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full opacity-25">
          <ellipse cx="200" cy="200" rx="195" ry="80" fill="none" stroke={RED} strokeWidth="1" strokeDasharray="8 6" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute"
        style={{ width: "75%", aspectRatio: "1" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full opacity-20">
          <ellipse cx="200" cy="200" rx="195" ry="65" fill="none" stroke={RED} strokeWidth="1" strokeDasharray="4 10" />
        </svg>
      </motion.div>

      {/* Glowing background circle */}
      <div
        className="absolute rounded-full"
        style={{
          width: "60%",
          aspectRatio: "1",
          background: `radial-gradient(circle, ${RED}33 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Main Car Image */}
      <motion.div
        className="relative z-10 w-full flex justify-center"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative w-full max-w-[820px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <img
              src={carImage}
              alt="Motonode performance vehicle showcase"
              className="w-full h-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 16px rgba(230,0,18,0.45)) drop-shadow(0 0 32px rgba(230,0,18,0.2))' }}
              width="820"
              height="460"
              loading="eager"
              fetchPriority="high"
            />
          </motion.div>
          
          {/* Floor reflection/glow */}
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-4 rounded-[100%] opacity-25"
            style={{ background: `radial-gradient(circle, ${RED}, transparent 80%)`, filter: 'blur(8px)' }}
          />

          {/* Label */}
          <div className="absolute -bottom-16 left-0 right-0 text-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[10px] uppercase tracking-[0.5em] text-primary/90 font-black"
            >
              Holographic Analysis: LP-770 Active
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Animated particles */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i % 3 === 0 ? 4 : 2,
            height: i % 3 === 0 ? 4 : 2,
            backgroundColor: RED,
            left: `${10 + (i * 73) % 82}%`,
            top: `${5 + (i * 47) % 88}%`,
            opacity: 0.5,
          }}
          animate={{
            y: [-8, 8, -8],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 2 + (i % 4) * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.18,
          }}
        />
      ))}

      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px opacity-40 pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${RED}, transparent)` }}
        animate={{ top: ["10%", "90%", "10%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-background">
      {/* Background grid + glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.08)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_40%_at_50%_100%,hsl(var(--primary)/0.05),transparent)] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-4 items-center">

          {/* Text Content */}
          <div className="text-center lg:text-left pt-10 lg:pt-0">
            <FadeIn delay={0.1}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                <span>India&apos;s Largest Auto Marketplace</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
                Connect Your Vehicle to the{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-red-500 dark:from-red-500 dark:via-rose-400 dark:to-red-400">
                  Best Services
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="text-base sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Welcome to Motonode, India&apos;s 1st Automobile Super App for spare parts, vehicle services, garage glovebox management, and rider community experiences.
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => scrollToSection("services")}
                  className="relative w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Explore Services
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => scrollToSection("become-partner")}
                  className="relative w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-primary border border-primary/50 hover:border-primary hover:bg-primary/10 transition-all cursor-pointer shadow-sm"
                >
                  Become a Dealer
                </motion.button>
              </div>
            </FadeIn>

            <FadeIn delay={0.6} className="mt-12 flex items-center justify-center lg:justify-start gap-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden shadow-sm">
                    <img
                      src={`https://i.pravatar.cc/80?img=${i + 10}`}
                      alt="Motonode community member"
                      className="w-full h-full object-cover"
                      width="40"
                      height="40"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-primary">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-foreground font-medium mt-1">Trusted by 10,000+ vehicle owners</p>
              </div>
            </FadeIn>
          </div>

          {/* Animated 3D-style car */}
          <div className="relative h-[340px] sm:h-[440px] lg:h-[560px] w-full">
            <AnimatedCar />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
    </section>
  );
}

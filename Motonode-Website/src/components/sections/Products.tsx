import { FadeIn } from "@/components/animations/FadeIn";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const categories = [
  { name: "Engine Oil & Lubricants", image: "engine-oil.png", items: "124 Products" },
  { name: "Brakes & Suspension", image: "brakes.png", items: "86 Products" },
  { name: "Tires & Wheels", image: "tires.png", items: "210 Products" },
  { name: "Spare Parts & Accessories", image: "accessories.png", items: "340 Products" },
];

export function Products() {
  return (
    <section id="products" className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-16">
          <FadeIn>
            <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-primary/10 text-primary">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Genuine <span className="text-primary">Parts & Accessories</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
              Shop genuine spare parts, engine oils, brakes, and tires directly from authorized seller stores.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <FadeIn key={idx} delay={idx * 0.1}>
              <Link href="/parts">
                <div className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border border-border bg-card shadow-md hover:shadow-xl transition-all duration-500">
                  <img 
                    src={`${import.meta.env.BASE_URL}images/${cat.image}`} 
                    alt={`${cat.name} available on Motonode`}
                    className="absolute inset-0 w-full h-full object-cover brightness-105 contrast-105 group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-6 flex flex-col justify-end">
                    <span className="text-xs font-semibold text-rose-400 mb-1 block">
                      {cat.items}
                    </span>
                    <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <div className="flex items-center text-xs font-semibold text-white/90 group-hover:text-primary transition-colors">
                      Explore Genuine Parts <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

      </div>
    </section>
  );
}

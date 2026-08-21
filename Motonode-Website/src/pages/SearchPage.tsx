import { FormEvent } from "react";
import { Search } from "lucide-react";
import { Link } from "wouter";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FadeIn } from "@/components/animations/FadeIn";
import { SEOHead } from "@/components/seo/SEOHead";
import { sitePageMap } from "@/config/site";
import { buildPageStructuredData } from "@/utils/seoHelpers";

const searchIndex = [
  {
    title: "Vehicle Services",
    description: "Car and bike maintenance, diagnostics, detailing, tire support, and workshop access.",
    href: "/services",
  },
  {
    title: "Spare Parts",
    description: "Automobile spare parts, engine oil, brakes, tires, and accessories.",
    href: "/parts",
  },
  {
    title: "Community",
    description: "Rider groups, chat, updates, social connections, and enthusiast networking.",
    href: "/community",
  },
  {
    title: "Ride Experiences",
    description: "Journey planning ideas, group coordination, and ride readiness support.",
    href: "/rides",
  },
  {
    title: "About Moto Node",
    description: "Learn about India's 1st Automobile Super App and its mission.",
    href: "/about",
  },
  {
    title: "Contact Moto Node",
    description: "Partnership, dealer onboarding, support, and general enquiries.",
    href: "/contact",
  },
];

export default function SearchPage() {
  const page = sitePageMap.search;
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q")?.trim() || "";
  const normalizedQuery = query.toLowerCase();
  const results = normalizedQuery
    ? searchIndex.filter((item) =>
        [item.title, item.description].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      )
    : [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("q") || "").trim();
    const searchPath = nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search";
    window.location.assign(searchPath);
  };

  return (
    <SiteLayout>
      <SEOHead
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
        noindex
        structuredData={buildPageStructuredData("search")}
      />

      <PageHeader
        eyebrow="Search"
        title="Search Moto Node"
        description="Use this simple search page to move quickly between Moto Node sections, service categories, parts information, and contact pages."
      />

      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 md:p-8 mb-8"
            >
              <label htmlFor="search-input" className="block text-sm font-medium text-white mb-3">
                Search the site
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="search-input"
                    name="q"
                    defaultValue={query}
                    placeholder="Search for services, parts, community, contact..."
                    className="w-full h-12 rounded-2xl border border-white/10 bg-black/50 pl-12 pr-4 text-white outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 px-6 rounded-2xl bg-primary text-black font-semibold hover:bg-primary/90 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </FadeIn>

          {query ? (
            <div className="grid gap-4">
              {results.length ? (
                results.map((result, index) => (
                  <FadeIn key={result.href} delay={index * 0.08}>
                    <Link
                      href={result.href}
                      className="block rounded-3xl border border-white/10 bg-zinc-950/60 p-6 hover:border-primary/40 transition-colors"
                    >
                      <h2 className="text-xl font-display font-semibold text-white mb-2">{result.title}</h2>
                      <p className="text-muted-foreground">{result.description}</p>
                    </Link>
                  </FadeIn>
                ))
              ) : (
                <FadeIn>
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8">
                    <h2 className="text-2xl font-display font-semibold text-white mb-3">No results found</h2>
                    <p className="text-muted-foreground">
                      Try broader terms like services, parts, community, rides, or contact.
                    </p>
                  </div>
                </FadeIn>
              )}
            </div>
          ) : (
            <FadeIn>
              <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8">
                <h2 className="text-2xl font-display font-semibold text-white mb-3">Popular searches</h2>
                <p className="text-muted-foreground mb-4">
                  Try searches like vehicle service, spare parts, rider community, or contact.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["vehicle service", "spare parts", "community", "dealer partner"].map((term) => (
                    <a
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white hover:border-primary/40 transition-colors"
                    >
                      {term}
                    </a>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

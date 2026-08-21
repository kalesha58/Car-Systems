import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteLayout>
      <SEOHead
        title="Page Not Found | Moto Node"
        description="The page you requested could not be found on Moto Node."
        path={window.location.pathname}
        noindex
      />

      <PageHeader
        eyebrow="404"
        title="This Moto Node page could not be found"
        description="The link may be outdated or the page may have moved. You can return home or continue to a key section from below."
      />

      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8 md:p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-muted-foreground mb-8">
              Try one of the main Moto Node destinations instead of the missing page.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/services">Browse Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

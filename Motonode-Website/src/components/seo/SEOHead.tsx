import { useEffect } from "react";
import { siteConfig } from "@/config/site";
import {
  generateMetaTags,
  generateOpenGraphTags,
  getCanonicalUrl,
} from "@/utils/seoHelpers";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  canonicalUrl?: string;
  keywords?: string[];
  author?: string;
  type?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown>[];
}

const upsertMeta = (
  selector: string,
  attributes: Record<string, string>,
  content?: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      element?.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  if (content !== undefined) {
    element.setAttribute("content", content);
  }
};

const upsertLink = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

export function SEOHead({
  title,
  description,
  image,
  path = "/",
  canonicalUrl,
  keywords,
  author = "Moto Node",
  type = "website",
  noindex = false,
  structuredData = [],
}: SEOHeadProps) {
  useEffect(() => {
    const pageMeta = generateMetaTags({
      path,
      title,
      description,
      keywords,
    });
    const openGraph = generateOpenGraphTags("home", {
      title: pageMeta.title,
      description: pageMeta.description,
      image: image || siteConfig.ogImage,
      url: pageMeta.url,
      type,
    });

    document.title = pageMeta.title;
    document.documentElement.lang = siteConfig.language;

    upsertMeta('meta[name="description"]', { name: "description" }, pageMeta.description);
    upsertMeta(
      'meta[name="keywords"]',
      { name: "keywords" },
      (keywords || siteConfig.keywords).join(", "),
    );
    upsertMeta('meta[name="author"]', { name: "author" }, author);
    upsertMeta(
      'meta[name="robots"]',
      { name: "robots" },
      noindex
        ? "noindex, nofollow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
    upsertMeta('meta[name="theme-color"]', { name: "theme-color" }, siteConfig.themeColor);
    upsertMeta(
      'meta[name="apple-mobile-web-app-capable"]',
      { name: "apple-mobile-web-app-capable" },
      "yes",
    );
    upsertMeta(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
      { name: "apple-mobile-web-app-status-bar-style" },
      "black-translucent",
    );
    upsertMeta(
      'meta[name="apple-mobile-web-app-title"]',
      { name: "apple-mobile-web-app-title" },
      siteConfig.name,
    );

    upsertMeta('meta[property="og:type"]', { property: "og:type" }, openGraph.type);
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, openGraph.url);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, openGraph.title);
    upsertMeta(
      'meta[property="og:description"]',
      { property: "og:description" },
      openGraph.description,
    );
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, openGraph.image);
    upsertMeta(
      'meta[property="og:site_name"]',
      { property: "og:site_name" },
      siteConfig.name,
    );
    upsertMeta(
      'meta[property="og:locale"]',
      { property: "og:locale" },
      siteConfig.locale,
    );

    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    upsertMeta('meta[name="twitter:url"]', { name: "twitter:url" }, openGraph.url);
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, openGraph.title);
    upsertMeta(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      openGraph.description,
    );
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, openGraph.image);
    upsertMeta(
      'meta[name="twitter:site"]',
      { name: "twitter:site" },
      siteConfig.twitterHandle,
    );

    if (import.meta.env.VITE_GOOGLE_SITE_VERIFICATION) {
      upsertMeta(
        'meta[name="google-site-verification"]',
        { name: "google-site-verification" },
        import.meta.env.VITE_GOOGLE_SITE_VERIFICATION,
      );
    }

    upsertLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl || getCanonicalUrl(path),
    });
    upsertLink('link[rel="alternate"][hreflang="en-IN"]', {
      rel: "alternate",
      hreflang: "en-IN",
      href: getCanonicalUrl(path),
    });
    upsertLink('link[rel="alternate"][hreflang="en"]', {
      rel: "alternate",
      hreflang: "en",
      href: getCanonicalUrl(path),
    });

    document.querySelectorAll('script[data-seo-jsonld="true"]').forEach((script) => {
      script.remove();
    });

    structuredData.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoJsonld = "true";
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, [author, canonicalUrl, description, image, keywords, noindex, path, structuredData, title, type]);

  return null;
}

import {
  defaultBreadcrumbs,
  siteConfig,
  sitePageMap,
  type BreadcrumbLink,
  type FAQItem,
  type SitePageConfig,
} from "@/config/site";

type StructuredDataType =
  | "organization"
  | "website"
  | "localBusiness"
  | "breadcrumb"
  | "product"
  | "service"
  | "faq";

interface ServiceStructuredDataInput {
  name?: string;
  description?: string;
  serviceType?: string[];
}

interface ProductStructuredDataInput {
  name?: string;
  description?: string;
  lowPrice?: string;
  highPrice?: string;
  offerCount?: string;
}

interface GenerateMetaOptions {
  page?: SitePageConfig["key"];
  path?: string;
  title?: string;
  description?: string;
  keywords?: string[];
}

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/" ? `${siteConfig.url}/` : `${siteConfig.url}${normalizedPath}`;
};

export const generateMetaTags = ({
  page = "home",
  path,
  title,
  description,
  keywords,
}: GenerateMetaOptions = {}) => {
  const pageMeta = sitePageMap[page] ?? sitePageMap.home;

  return {
    title: title || pageMeta.title,
    description: description || pageMeta.description,
    keywords: keywords || pageMeta.keywords,
    canonicalUrl: getCanonicalUrl(path || pageMeta.path),
    url: absoluteUrl(path || pageMeta.path),
  };
};

export const generateStructuredData = (
  type: StructuredDataType = "organization",
  data:
    | BreadcrumbLink[]
    | FAQItem[]
    | ServiceStructuredDataInput
    | ProductStructuredDataInput
    | Record<string, unknown> = {},
) => {
  switch (type) {
    case "website":
      return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      };
    case "localBusiness":
      return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: siteConfig.name,
        image: `${siteConfig.url}/images/logo-icon.png`,
        description: siteConfig.description,
        url: siteConfig.url,
        telephone: siteConfig.contact.phoneE164,
        email: siteConfig.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.streetAddress,
          addressLocality: siteConfig.contact.locality,
          addressRegion: siteConfig.contact.region,
          postalCode: siteConfig.contact.postalCode,
          addressCountry: siteConfig.contact.country,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: siteConfig.supportHours.days,
          opens: siteConfig.supportHours.opens,
          closes: siteConfig.supportHours.closes,
        },
        sameAs: siteConfig.sameAs,
      };
    case "breadcrumb":
      return createBreadcrumb((data as BreadcrumbLink[]) || []);
    case "product": {
      const productData = data as ProductStructuredDataInput;

      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: productData.name || "Automobile Spare Parts",
        description:
          productData.description ||
          "Wide range of genuine automobile spare parts available on Moto Node.",
        brand: {
          "@type": "Brand",
          name: siteConfig.name,
        },
        offers: {
          "@type": "AggregateOffer",
          url: `${siteConfig.url}/parts`,
          availability: "https://schema.org/InStock",
          priceCurrency: "INR",
          lowPrice: productData.lowPrice || "100",
          highPrice: productData.highPrice || "5000",
          offerCount: productData.offerCount || "10",
        },
      };
    }
    case "service": {
      const serviceData = data as ServiceStructuredDataInput;

      return {
        "@context": "https://schema.org",
        "@type": "Service",
        name: serviceData.name || "Automobile Services",
        description:
          serviceData.description ||
          "Book professional vehicle services including maintenance, repair, diagnostics, and detailing.",
        provider: {
          "@type": "Organization",
          name: siteConfig.name,
        },
        areaServed: "IN",
        serviceType: serviceData.serviceType || [
          "Vehicle Maintenance",
          "Repair",
          "Diagnostics",
          "Cleaning",
        ],
      };
    }
    case "faq":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: ((data as FAQItem[]) || []).map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };
    case "organization":
    default:
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: siteConfig.url,
        logo: `${siteConfig.url}/images/logo-icon.png`,
        description: siteConfig.description,
        sameAs: siteConfig.sameAs,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: siteConfig.contact.phoneE164,
          email: siteConfig.contact.email,
          contactType: "customer service",
          areaServed: "IN",
        },
      };
  }
};

export const createBreadcrumb = (items: BreadcrumbLink[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const getBreadcrumbs = (page: SitePageConfig["key"]) => {
  if (page === "home" || page === "search") {
    return [];
  }

  return defaultBreadcrumbs[page];
};

export const getCanonicalUrl = (path = "/") => absoluteUrl(path);

export const generateOpenGraphTags = (
  page: SitePageConfig["key"] = "home",
  customData: Partial<{
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  }> = {},
) => {
  const meta = generateMetaTags({ page });

  return {
    title: meta.title,
    description: meta.description,
    image: siteConfig.ogImage,
    url: meta.url,
    type: "website",
    ...customData,
  };
};

export const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const generatePageTitle = (pageTitle: string, includeSiteName = true) => {
  const siteName = siteConfig.name;
  if (includeSiteName && pageTitle !== siteName) {
    return `${pageTitle} | ${siteName}`;
  }

  return pageTitle;
};

export const isMobileViewport = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth <= 768;
};

export const buildPageStructuredData = (
  page: SitePageConfig["key"],
  options?: {
    faqItems?: FAQItem[];
    breadcrumbs?: BreadcrumbLink[];
    serviceData?: ServiceStructuredDataInput;
    productData?: ProductStructuredDataInput;
  },
) => {
  const baseData = [
    generateStructuredData("organization"),
    generateStructuredData("website"),
    generateStructuredData("localBusiness"),
  ];

  if (page === "services") {
    baseData.push(generateStructuredData("service", options?.serviceData));
  }

  if (page === "parts") {
    baseData.push(generateStructuredData("product", options?.productData));
  }

  if (options?.faqItems?.length) {
    baseData.push(generateStructuredData("faq", options.faqItems));
  }

  return baseData;
};

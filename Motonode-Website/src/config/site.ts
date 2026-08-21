export interface BreadcrumbLink {
  name: string;
  path: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SitePageConfig {
  key:
    | "home"
    | "services"
    | "parts"
    | "community"
    | "rides"
    | "about"
    | "blog"
    | "contact"
    | "privacy"
    | "terms"
    | "search";
  path: string;
  navLabel?: string;
  title: string;
  description: string;
  keywords: string[];
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
  indexable?: boolean;
}

const fallbackSiteUrl = "https://www.motonode.in";
const envSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
const resolvedSiteUrl = (envSiteUrl && envSiteUrl.replace(/\/$/, "")) || fallbackSiteUrl;

export const siteConfig = {
  name: import.meta.env.VITE_SITE_NAME?.trim() || "Moto Node",
  shortName: "MotoNode",
  url: resolvedSiteUrl,
  description:
    import.meta.env.VITE_SITE_DESCRIPTION?.trim() ||
    "Welcome to Moto Node - India's 1st Automobile Super App. Order spare parts online, book vehicle services, connect with riders, and enjoy ride experiences in one place.",
  keywords: (
    import.meta.env.VITE_SITE_KEYWORDS?.split(",").map((keyword) => keyword.trim()).filter(Boolean) || [
      "automobile parts India",
      "vehicle service booking",
      "bike community",
      "motorcycle service",
      "car parts online",
      "auto spare parts",
      "bike spare parts",
      "ride experiences",
      "automobile super app",
    ]
  ),
  ogImage: import.meta.env.VITE_OG_IMAGE?.trim() || "https://www.motonode.in/opengraph.jpg",
  twitterHandle: import.meta.env.VITE_TWITTER_HANDLE?.trim() || "@motonode",
  themeColor: "#E60012",
  locale: "en_IN",
  language: "en-IN",
  contact: {
    phoneDisplay: "+91 95737 59696",
    phoneE164: "+919573759696",
    email: "support@motonode.in",
    streetAddress: "Hyderabad",
    locality: "Hyderabad",
    region: "Telangana",
    postalCode: "501505",
    country: "IN",
  },
  supportHours: {
    opens: "09:00",
    closes: "21:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  sameAs: [
    "https://www.instagram.com/moto.node?igsh=MWNoYmdqMG1yaXZxZw==",
  ],
} as const;

export const sitePages: SitePageConfig[] = [
  {
    key: "home",
    path: "/",
    navLabel: "Home",
    title: "Moto Node: Automobile Services, Bike Service & Car Parts",
    description:
      "Moto Node offers automobile services in India, bike service booking, and car parts discovery in one platform for riders, drivers, dealers, and community.",
    keywords: [
      "Moto Node",
      "automobile super app",
      "vehicle services India",
      "spare parts online",
      "rider community India",
    ],
    changefreq: "weekly",
    priority: "1.0",
    indexable: true,
  },
  {
    key: "services",
    path: "/services",
    navLabel: "Services",
    title: "Vehicle Services - Book Car & Bike Maintenance Online | Moto Node",
    description:
      "Book trusted vehicle services with Moto Node. Explore car servicing, bike maintenance, diagnostics, detailing, tire support, and battery care from verified professionals.",
    keywords: [
      "vehicle services India",
      "car maintenance booking",
      "bike repair online",
      "auto service booking",
      "Moto Node services",
    ],
    changefreq: "weekly",
    priority: "0.9",
    indexable: true,
  },
  {
    key: "parts",
    path: "/parts",
    navLabel: "Parts",
    title: "Automobile Spare Parts Online | Moto Node",
    description:
      "Order genuine automobile spare parts, oils, tires, brakes, and accessories online with Moto Node. Discover verified sellers and reliable delivery support.",
    keywords: [
      "automobile spare parts online",
      "bike spare parts India",
      "car parts online India",
      "genuine auto parts",
      "Moto Node parts",
    ],
    changefreq: "weekly",
    priority: "0.9",
    indexable: true,
  },
  {
    key: "community",
    path: "/community",
    navLabel: "Community",
    title: "Rider Community - Connect, Share & Chat | Moto Node",
    description:
      "Join the Moto Node rider community to connect with fellow automobile enthusiasts, chat, create groups, share updates, and stay part of every ride.",
    keywords: [
      "rider community India",
      "bike community app",
      "automobile community",
      "Moto Node chat groups",
      "rider social network",
    ],
    changefreq: "weekly",
    priority: "0.8",
    indexable: true,
  },
  {
    key: "rides",
    path: "/rides",
    navLabel: "Rides",
    title: "Ride Experiences & Automotive Journeys | Moto Node",
    description:
      "Plan better ride experiences with Moto Node. Discover ride ideas, group coordination tools, service readiness tips, and smarter automobile journeys.",
    keywords: [
      "ride experiences India",
      "group rides",
      "motorcycle ride planning",
      "road trip support",
      "Moto Node rides",
    ],
    changefreq: "weekly",
    priority: "0.8",
    indexable: true,
  },
  {
    key: "about",
    path: "/about",
    navLabel: "About",
    title: "About Moto Node - India's 1st Automobile Super App",
    description:
      "Learn about Moto Node, India's 1st Automobile Super App built to simplify spare parts, services, dealer access, and community connections for vehicle owners.",
    keywords: [
      "about Moto Node",
      "automobile app India",
      "vehicle platform",
      "Moto Node company",
      "automobile ecosystem",
    ],
    changefreq: "monthly",
    priority: "0.7",
    indexable: true,
  },
  {
    key: "blog",
    path: "/blog",
    navLabel: "Blog",
    title: "Automobile Blog, Guides & Maintenance Tips | Moto Node",
    description:
      "Read Moto Node articles on maintenance, spare parts, community trends, and practical tips to keep your vehicle running smarter.",
    keywords: [
      "automobile blog India",
      "vehicle maintenance tips",
      "bike care guide",
      "car care articles",
      "Moto Node blog",
    ],
    changefreq: "weekly",
    priority: "0.8",
    indexable: false,
  },
  {
    key: "contact",
    path: "/contact",
    navLabel: "Contact",
    title: "Contact Moto Node | Dealer Partnerships, Support & Enquiries",
    description:
      "Contact Moto Node for support, dealer onboarding, partnership opportunities, or service questions. Reach us by phone, email, or WhatsApp.",
    keywords: [
      "contact Moto Node",
      "dealer partnership",
      "automobile app support",
      "Moto Node contact",
      "vehicle services enquiry",
    ],
    changefreq: "monthly",
    priority: "0.7",
    indexable: true,
  },
  {
    key: "privacy",
    path: "/privacy",
    title: "Privacy Policy | Moto Node",
    description:
      "How Motonode collects and uses account, location, photo, map, payment, and booking data, and how you can delete your account.",
    keywords: [
      "Moto Node privacy",
      "privacy policy",
      "data protection",
      "account deletion",
      "location photos maps",
    ],
    changefreq: "yearly",
    priority: "0.5",
    indexable: true,
  },
  {
    key: "terms",
    path: "/terms",
    title: "Terms of Service | Moto Node",
    description:
      "Read the Moto Node terms of service covering access, user responsibilities, platform content, service interactions, and legal conditions.",
    keywords: ["Moto Node terms", "terms of service", "website terms", "platform rules"],
    changefreq: "yearly",
    priority: "0.5",
    indexable: true,
  },
  {
    key: "search",
    path: "/search",
    title: "Search Moto Node",
    description:
      "Search across Moto Node pages, services, parts, and community content to find the information you need faster.",
    keywords: ["Moto Node search", "search services", "search parts"],
    indexable: false,
  },
];

export const sitePageMap = Object.fromEntries(
  sitePages.map((page) => [page.key, page]),
) as Record<SitePageConfig["key"], SitePageConfig>;

export const primaryNavigation = sitePages.filter((page) => page.navLabel);

export const homeFaqs: FAQItem[] = [
  {
    question: "How do I book a vehicle service on Moto Node?",
    answer:
      "Browse the available service categories, choose the support you need, and contact Moto Node or a listed partner to confirm your booking.",
  },
  {
    question: "What spare parts are available on Moto Node?",
    answer:
      "Moto Node highlights genuine oils, brakes, tires, accessories, and other automobile essentials from verified sellers and dealers.",
  },
  {
    question: "How do I join the Moto Node community?",
    answer:
      "Use the platform to connect with fellow riders, join conversations, discover group experiences, and stay updated with community-driven automotive content.",
  },
];

export const defaultBreadcrumbs: Record<
  Exclude<SitePageConfig["key"], "home" | "search">,
  BreadcrumbLink[]
> = {
  services: [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
  ],
  parts: [
    { name: "Home", path: "/" },
    { name: "Parts", path: "/parts" },
  ],
  community: [
    { name: "Home", path: "/" },
    { name: "Community", path: "/community" },
  ],
  rides: [
    { name: "Home", path: "/" },
    { name: "Rides", path: "/rides" },
  ],
  about: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ],
  blog: [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ],
  contact: [
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ],
  privacy: [
    { name: "Home", path: "/" },
    { name: "Privacy Policy", path: "/privacy" },
  ],
  terms: [
    { name: "Home", path: "/" },
    { name: "Terms of Service", path: "/terms" },
  ],
};

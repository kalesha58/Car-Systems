import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const CANONICAL_ORIGIN = "https://www.motonode.in";
const OG_IMAGE = `${CANONICAL_ORIGIN}/opengraph.jpg`;

const seoPages: Array<{
  file: string;
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}> = [
  {
    file: "index.html",
    path: "/",
    title: "Moto Node: Automobile Services, Bike Service & Car Parts",
    description:
      "Moto Node offers automobile services in India, bike service booking, and car parts discovery in one platform for riders, drivers, dealers, and community.",
  },
  {
    file: "privacy.html",
    path: "/privacy",
    title: "Privacy Policy | Moto Node",
    description:
      "How Motonode collects and uses account, location, photo, map, payment, and booking data, and how you can delete your account.",
  },
  {
    file: "delete-account.html",
    path: "/delete-account",
    title: "Delete Account | Moto Node",
    description:
      "Request deletion of your Motonode account and associated personal data by email, or delete the account from the Motonode app.",
  },
  {
    file: "terms.html",
    path: "/terms",
    title: "Terms of Service | Moto Node",
    description:
      "Read the Moto Node terms of service covering access, user responsibilities, platform content, service interactions, and legal conditions.",
  },
  {
    file: "about.html",
    path: "/about",
    title: "About Moto Node | India's 1st Automobile Super App",
    description:
      "Learn about Moto Node, India's 1st Automobile Super App built to simplify spare parts, services, dealer access, and community connections for vehicle owners.",
  },
  {
    file: "services.html",
    path: "/services",
    title: "Vehicle Services - Book Car & Bike Maintenance Online | Moto Node",
    description:
      "Book trusted vehicle services with Moto Node. Explore car servicing, bike maintenance, diagnostics, detailing, tire support, and battery care from verified professionals.",
  },
  {
    file: "parts.html",
    path: "/parts",
    title: "Automobile Spare Parts Online | Moto Node",
    description:
      "Order genuine automobile spare parts, oils, tires, brakes, and accessories online with Moto Node. Discover verified sellers and reliable delivery support.",
  },
  {
    file: "community.html",
    path: "/community",
    title: "Rider Community & Automotive Groups | Moto Node",
    description:
      "Join the Moto Node rider community to connect with vehicle owners, share ride stories, and stay close to automobile culture in India.",
  },
  {
    file: "rides.html",
    path: "/rides",
    title: "Ride Experiences & Group Journeys | Moto Node",
    description:
      "Discover ride experiences, group journey ideas, and community-led travel planning with Moto Node.",
  },
  {
    file: "blog.html",
    path: "/blog",
    title: "Automobile Blog, Guides & Maintenance Tips | Moto Node",
    description:
      "Read Moto Node articles on maintenance, spare parts, community trends, and practical tips to keep your vehicle running smarter.",
    noindex: true,
  },
  {
    file: "contact.html",
    path: "/contact",
    title: "Contact Moto Node | Dealer Partnerships, Support & Enquiries",
    description:
      "Contact Moto Node for support, dealer onboarding, partnership opportunities, or service questions. Reach us by phone, email, or WhatsApp.",
  },
  {
    file: "search.html",
    path: "/search",
    title: "Search Moto Node",
    description:
      "Search across Moto Node pages, services, parts, and community content to find the information you need faster.",
    noindex: true,
  },
];

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const setMetaContent = (html: string, attr: "name" | "property", key: string, value: string) =>
  html.replace(
    new RegExp(`(${attr}="${key}"[\\s\\S]*?content=")[^"]*(")`),
    `$1${escapeAttr(value)}$2`,
  );

const applyPageSeo = (
  html: string,
  page: (typeof seoPages)[number],
) => {
  const pageUrl = page.path === "/" ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${page.path}`;
  const robots = page.noindex
    ? "noindex, nofollow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  let next = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${page.title}</title>`);
  next = setMetaContent(next, "name", "description", page.description);
  next = setMetaContent(next, "name", "robots", robots);
  next = setMetaContent(next, "property", "og:url", pageUrl);
  next = setMetaContent(next, "property", "og:title", page.title);
  next = setMetaContent(next, "property", "og:description", page.description);
  next = setMetaContent(next, "property", "og:image", OG_IMAGE);
  next = setMetaContent(next, "name", "twitter:url", pageUrl);
  next = setMetaContent(next, "name", "twitter:title", page.title);
  next = setMetaContent(next, "name", "twitter:description", page.description);
  next = next
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${pageUrl}$2`)
    .replace(
      /(<link\s+rel="alternate"\s+hreflang="en-IN"\s+href=")[^"]*(")/,
      `$1${pageUrl}$2`,
    )
    .replace(/(<link\s+rel="alternate"\s+hreflang="en"\s+href=")[^"]*(")/, `$1${pageUrl}$2`)
    .replace(/(<link\s+rel="image_src"\s+href=")[^"]*(")/, `$1${OG_IMAGE}$2`);
  return next;
};

const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    {
      name: "spa-html-copies",
      closeBundle() {
        const dist = path.resolve(import.meta.dirname, "dist");
        const indexPath = path.join(dist, "index.html");
        if (!fs.existsSync(indexPath)) {
          return;
        }
        const source = fs.readFileSync(indexPath, "utf8");
        for (const page of seoPages) {
          const html = applyPageSeo(source, page);
          fs.writeFileSync(path.join(dist, page.file), html);
        }
        fs.writeFileSync(path.join(dist, "404.html"), applyPageSeo(source, seoPages[0]));
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: securityHeaders,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: securityHeaders,
  },
});

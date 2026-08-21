import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbLink } from "@/config/site";

interface BreadcrumbsProps {
  items: BreadcrumbLink[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1;

          return (
            <li key={item.path} className="flex items-center gap-2">
              {isCurrentPage ? (
                <span className="text-white">{item.name}</span>
              ) : (
                <Link href={item.path} className="hover:text-primary transition-colors">
                  {item.name}
                </Link>
              )}
              {!isCurrentPage && <ChevronRight className="w-4 h-4" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

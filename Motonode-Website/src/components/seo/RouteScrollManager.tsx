import { useEffect } from "react";
import { useLocation } from "wouter";

export function RouteScrollManager() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location]);

  return null;
}

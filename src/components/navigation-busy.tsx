"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLoader } from "@/components/page-loader";

export function NavigationBusy() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      window.setTimeout(() => setPending(true), 0);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const id = window.setTimeout(() => setPending(false), 8000);
    return () => window.clearTimeout(id);
  }, [pending]);

  if (!pending) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#f4f1ea]/75"
      aria-live="polite"
      aria-busy="true"
    >
      <PageLoader label="Loading" />
    </div>
  );
}

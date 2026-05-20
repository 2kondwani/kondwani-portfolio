"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps page content with a smooth fade-up animation on every route change.
 * Re-keys on pathname so React tears down and rebuilds the subtree, letting
 * the CSS keyframe replay. Cheap, dependency-free, and respects
 * prefers-reduced-motion via the CSS rule.
 */
export default function PageTransition({ children }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="aero-page-transition">
      {children}
    </div>
  );
}

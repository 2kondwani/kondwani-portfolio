"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const LINKS = [
  { href: "/", label: "home" },
  { href: "/gallery", label: "gallery" },
  { href: "/academic", label: "academic / work" },
  { href: "/projects", label: "projects" },
  { href: "/more", label: "more" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile sheet whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when the mobile sheet is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      <nav className="aero-nav" aria-label="Primary">
        <Link href="/" className="aero-wordmark">
          kondwani phiri
        </Link>

        <ul className="aero-nav-links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={pathname === l.href ? "active" : ""}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="aero-menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="aero-menu-icon" data-open={open ? "true" : "false"}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </nav>

      {/* Mobile glass sheet */}
      <div
        className={`aero-sheet ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div className="aero-sheet-inner" onClick={(e) => e.stopPropagation()}>
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={pathname === l.href ? "active" : ""}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "our-story",   label: "Our Story" },
  { id: "our-values",  label: "Our Values" },
  { id: "for-sellers", label: "For Sellers" },
  { id: "for-buyers",  label: "For Buyers" },
];

export default function AboutSectionNav() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
          {SECTIONS.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`
                  shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all
                  ${isActive
                    ? "bg-[#0D47A1] text-white shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

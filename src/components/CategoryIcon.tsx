import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Resolves a category icon stored as either:
 *  - a lucide icon name (e.g. "Code", "Smartphone", "BarChart3")
 *  - an emoji or single character
 *  - null/undefined (falls back to BookOpen)
 */
export function CategoryIcon({
  name,
  className = "h-6 w-6",
}: {
  name?: string | null;
  className?: string;
}) {
  if (!name) {
    const Fallback = Icons.BookOpen;
    return <Fallback className={className} />;
  }
  // If it looks like a lucide icon name (PascalCase letters/digits only), render it
  if (/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    const Comp = (Icons as unknown as Record<string, LucideIcon>)[name];
    if (Comp) return <Comp className={className} />;
  }
  // Otherwise treat as emoji / text glyph
  return <span className="text-2xl leading-none">{name}</span>;
}

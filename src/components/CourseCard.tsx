import { Link } from "@tanstack/react-router";
import { Star, Users, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Course = Database["public"]["Tables"]["courses"]["Row"];

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to="/course/$slug"
      params={{ slug: course.slug }}
      className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 hover:shadow-glow transition-all"
    >
      <div className="aspect-video bg-muted relative overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="h-full w-full bg-gradient-primary opacity-60" />
        )}
        {course.is_featured && (
          <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-background/80 backdrop-blur px-2 py-0.5 rounded">Featured</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{course.short_description}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{Number(course.rating ?? 0).toFixed(1)}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrollment_count}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round((course.duration_minutes ?? 0) / 60)}h</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs uppercase text-muted-foreground">{course.difficulty}</span>
          <span className="font-bold text-primary">{Number(course.price ?? 0) === 0 ? "Free" : `$${course.price}`}</span>
        </div>
      </div>
    </Link>
  );
}

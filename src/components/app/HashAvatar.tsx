import { avatarColor, initials } from "@/lib/avatar-color";
import { cn } from "@/lib/utils";

export function HashAvatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const dims = size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-14 w-14 text-base" : "h-9 w-9 text-xs";
  return (
    <div
      aria-hidden
      className={cn(
        "grid place-items-center rounded-full font-bold shrink-0 ring-2 ring-background",
        dims,
        avatarColor(name),
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}

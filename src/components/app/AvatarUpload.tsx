import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";

function keyFor(email: string) {
  return `sdmodel.avatar.${email.toLowerCase()}`;
}

export function getStoredAvatar(email: string | undefined): string | null {
  if (!email || typeof window === "undefined") return null;
  try { return localStorage.getItem(keyFor(email)); } catch { return null; }
}

export function AvatarUpload({
  email,
  initials,
  size = 96,
  ring = true,
}: {
  email: string;
  initials: string;
  size?: number;
  ring?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSrc(getStoredAvatar(email)); }, [email]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_500_000) { toast.error("Image must be under 2.5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      try { localStorage.setItem(keyFor(email), dataUrl); } catch {}
      setSrc(dataUrl);
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(f);
  }

  function remove() {
    try { localStorage.removeItem(keyFor(email)); } catch {}
    setSrc(null);
    toast.success("Photo removed");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative group rounded-full"
        style={{ width: size, height: size }}
      >
        <div
          className={`h-full w-full overflow-hidden rounded-full bg-crimson text-crimson-foreground font-bold grid place-items-center shadow-lg ${
            ring ? "ring-4 ring-card" : ""
          }`}
          style={{ fontSize: Math.round(size / 3) }}
        >
          {src ? (
            <img src={src} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Change profile photo"
          className="absolute inset-0 grid place-items-center rounded-full bg-black/0 opacity-0 transition-all group-hover:bg-black/55 group-hover:opacity-100 focus-visible:bg-black/55 focus-visible:opacity-100 focus-visible:outline-none"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-input bg-card/60 px-3 text-xs font-medium hover:bg-accent transition-colors"
        >
          <Camera className="h-3.5 w-3.5" /> Change photo
        </button>
        {src && (
          <button
            type="button"
            onClick={remove}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-input bg-card/60 px-3 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

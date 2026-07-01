import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { getStoredAvatar } from "@/components/app/AvatarUpload";
import { LogOut, User, Moon, Sun } from "lucide-react";

export function UserMenu() {
  const { session, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => { setAvatar(getStoredAvatar(session?.email)); }, [session?.email]);

  if (!session) return null;
  const initials = session.name.split(" ").slice(-2).map((p) => p[0]).join("").toUpperCase();
  const profileUrl = session.role === "admin" ? "/admin/profile" : "/teacher";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="grid h-9 w-9 place-items-center rounded-full border bg-card/60 hover:bg-muted transition-colors"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="overflow-hidden grid h-9 w-9 place-items-center rounded-full bg-crimson text-crimson-foreground text-xs font-bold ring-2 ring-card hover:opacity-90 transition-opacity">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm font-medium truncate">{session.name}</div>
            <div className="text-xs text-muted-foreground truncate">{session.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={profileUrl} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="cursor-pointer text-crimson focus:text-crimson"
          >
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

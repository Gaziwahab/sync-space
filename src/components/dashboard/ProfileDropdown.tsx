import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface ProfileDropdownProps {
  user: User | null;
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const displayName = profile?.display_name;
  const avatarUrl = profile?.avatar_url;

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform hover:scale-105 active:scale-95">
          <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/20 shadow-md">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />}
            <AvatarFallback className="text-sm bg-gradient-to-br from-primary to-accent text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 clay-card border-0 p-2 mt-2">
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />}
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary to-accent text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{displayName ?? "My Account"}</p>
              <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">{user?.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-border/50 my-1.5" />
        
        <DropdownMenuItem 
          onClick={() => navigate("/dashboard/settings")}
          className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-muted/50 focus:bg-primary/10 focus:text-primary transition-colors mb-1"
        >
          <Settings className="mr-3 h-4 w-4" /> 
          <span className="font-medium">Settings & API Keys</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-destructive/10 focus:bg-destructive/20 text-destructive focus:text-destructive transition-colors mt-2"
        >
          <LogOut className="mr-3 h-4 w-4" /> 
          <span className="font-medium">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

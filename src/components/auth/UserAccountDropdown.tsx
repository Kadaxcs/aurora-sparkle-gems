import { useState, useEffect } from "react";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileDialog } from "./UserProfileDialog";
import { supabase } from "@/integrations/supabase/client";

interface UserAccountDropdownProps {
  user: any;
}

export function UserAccountDropdown({ user }: UserAccountDropdownProps) {
  const navigate = useNavigate();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAdminAccess = () => {
    navigate('/admin');
  };

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.display_name || user?.email?.split('@')[0] || 'Usuário';

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-background border shadow-lg z-50"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Minha Conta</span>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAdminAccess}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Painel Administrativo</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={user}
        profile={profile}
        onProfileUpdate={fetchProfile}
      />
    </>
  );
}
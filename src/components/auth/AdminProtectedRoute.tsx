import { useState, useEffect, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('AdminProtectedRoute: Inicializando autenticação...');
        
        // Primeiro, verificar se há uma sessão ativa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('AdminProtectedRoute: Session:', session?.user?.id, 'Error:', sessionError);
        
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          
          // Buscar perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          console.log('AdminProtectedRoute: Profile:', profile, 'Error:', profileError);
          
          if (mounted) {
            setProfile(profile);
          }
        }
        
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('AdminProtectedRoute: Erro na inicialização:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AdminProtectedRoute: Auth state change:', event, session?.user?.id);
      
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        // Buscar perfil de forma simples
        const fetchProfile = async () => {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            console.log('AdminProtectedRoute: Profile update:', profile, 'Error:', error);
            if (mounted) {
              setProfile(profile);
            }
          } catch (err) {
            console.error('AdminProtectedRoute: Error updating profile:', err);
            if (mounted) {
              setProfile(null);
            }
          }
        };
        fetchProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
      
      if (initialized && mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  console.log('AdminProtectedRoute: Render - loading:', loading, 'user:', !!user, 'profile role:', profile?.role);

  if (loading) {
    console.log('AdminProtectedRoute: Mostrando tela de loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    console.log('AdminProtectedRoute: Redirecionando para login - user:', !!user, 'admin:', profile?.role === 'admin');
    return <Navigate to="/admin/login" replace />;
  }

  console.log('AdminProtectedRoute: Renderizando children');
  return <>{children}</>;
}
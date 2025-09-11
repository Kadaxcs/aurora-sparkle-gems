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

  useEffect(() => {
    console.log('AdminProtectedRoute: useEffect iniciado');
    const checkAuth = async () => {
      try {
        console.log('AdminProtectedRoute: Verificando autenticação...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('AdminProtectedRoute: User:', user, 'Error:', userError);
        setUser(user);

        if (user) {
          console.log('AdminProtectedRoute: Buscando perfil para user:', user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          console.log('AdminProtectedRoute: Profile:', profile, 'Error:', profileError);
          setProfile(profile);
        }
        setLoading(false);
        console.log('AdminProtectedRoute: Loading definido como false');
      } catch (error) {
        console.error('AdminProtectedRoute: Erro no checkAuth:', error);
        setLoading(false);
      }
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setProfile(profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log('AdminProtectedRoute: Render - loading:', loading, 'user:', user, 'profile:', profile);

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
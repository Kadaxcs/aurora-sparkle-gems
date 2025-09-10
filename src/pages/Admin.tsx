import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminCoupons } from "@/components/admin/AdminCoupons";
import { AdminProductImport } from "@/components/admin/AdminProductImport";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setProfile(profile);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "products":
        return <AdminProducts />;
      case "import":
        return <AdminProductImport />;
      case "orders":
        return <AdminOrders />;
      case "categories":
        return <AdminCategories />;
      case "coupons":
        return <AdminCoupons />;
      case "users":
        return <AdminUsers />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
}
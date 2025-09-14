import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminCoupons } from "@/components/admin/AdminCoupons";
import { AdminProductImport } from "@/components/admin/AdminProductImport";
import { ProductUpdatePanel } from "@/components/admin/ProductUpdatePanel";
import { EmailNotificationPanel } from "@/components/admin/EmailNotificationPanel";
import MercadoPagoWebhookPanel from "@/components/admin/MercadoPagoWebhookPanel";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminPages } from "@/components/admin/AdminPages";
import { HubJoiasManagement } from "@/components/admin/HubJoiasManagement";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { toast } = useToast();

  const getSectionTitle = (section: string) => {
    const titles: { [key: string]: string } = {
      dashboard: "Dashboard",
      hubjoias: "Gestão HubJoias",
      products: "Produtos",
      update: "Atualizar Produtos",
      import: "Importar Produtos",
      orders: "Pedidos",
      notifications: "Email Pedidos", 
      webhook: "Webhook Mercado Pago",
      categories: "Categorias",
      coupons: "Cupons",
      users: "Usuários",
      pages: "Páginas"
    };
    return titles[section] || "Dashboard";
  };

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    // Toast apenas no mobile
    if (window.innerWidth < 1024) {
      toast({
        title: getSectionTitle(section),
        description: "Seção carregada com sucesso",
        duration: 1500,
      });
    }
  }, [toast]);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "hubjoias":
        return <HubJoiasManagement />;
      case "products":
        return <AdminProducts />;
      case "update":
        return <ProductUpdatePanel />;
      case "import":
        return <AdminProductImport />;
      case "orders":
        return <AdminOrders />;
      case "notifications":
        return <EmailNotificationPanel />;
      case "webhook":
        return <MercadoPagoWebhookPanel />;
      case "categories":
        return <AdminCategories />;
      case "coupons":
        return <AdminCoupons />;
      case "users":
        return <AdminUsers />;
      case "pages":
        return <AdminPages />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          {/* Header fixo com triggers e navegação */}
          <header className="lg:hidden h-16 flex items-center justify-between border-b bg-background px-4 fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="shrink-0" />
              <h1 className="font-serif text-primary text-lg truncate">Admin Panel</h1>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Loja</span>
              </Link>
            </Button>
          </header>

          {/* Header desktop */}
          <header className="hidden lg:flex h-16 items-center justify-between border-b bg-background px-6 fixed top-0 left-64 right-0 z-40">
            <h1 className="font-serif text-primary text-xl">Painel Administrativo</h1>
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para a Loja
              </Link>
            </Button>
          </header>
          
            <AdminSidebar 
              activeSection={activeSection} 
              onSectionChange={handleSectionChange} 
            />
          
          <main className="flex-1 p-4 lg:p-6 lg:mt-16 mt-16 lg:ml-0 overflow-auto">
            {/* Navegação móvel com dropdown */}
            <AdminMobileNav 
              activeSection={activeSection} 
              onSectionChange={handleSectionChange}
            />

            {/* Ações rápidas para mobile */}
            <AdminQuickActions onSectionChange={handleSectionChange} />
            
            <div className="max-w-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AdminProtectedRoute>
  );
}
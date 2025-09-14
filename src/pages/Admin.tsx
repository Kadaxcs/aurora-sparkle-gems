import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Admin() {
  const [activeSection, setActiveSection] = useState("dashboard");

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
          <AdminSidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
      </SidebarProvider>
    </AdminProtectedRoute>
  );
}
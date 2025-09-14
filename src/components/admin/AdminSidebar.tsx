import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FolderOpen, 
  Ticket, 
  Users,
  Upload,
  FileText,
  RefreshCw,
  Mail,
  Webhook,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "hubjoias", label: "Gestão HubJoias", icon: Settings },
  { id: "products", label: "Produtos", icon: Package },
  { id: "update", label: "Atualizar Produtos", icon: RefreshCw },
  { id: "import", label: "Importar Produtos", icon: Upload },
  { id: "orders", label: "Pedidos", icon: ShoppingCart },
  { id: "notifications", label: "Email Pedidos", icon: Mail },
  { id: "webhook", label: "Webhook Mercado Pago", icon: Webhook },
  { id: "categories", label: "Categorias", icon: FolderOpen },
  { id: "coupons", label: "Cupons", icon: Ticket },
  { id: "users", label: "Usuários", icon: Users },
  { id: "pages", label: "Páginas", icon: FileText },
];

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <Sidebar className="w-64" collapsible="offcanvas">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-serif text-primary px-4 py-6">
            Painel Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full justify-start h-12 px-4 rounded-lg transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-secondary"
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
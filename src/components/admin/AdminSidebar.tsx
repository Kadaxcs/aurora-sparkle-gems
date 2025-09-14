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
  SidebarTrigger,
  useSidebar,
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
  const { open, setOpen } = useSidebar();
  
  return (
    <Sidebar className="w-64 lg:w-64" collapsible="icon">
      {/* Mobile trigger inside sidebar */}
      <SidebarTrigger className="lg:hidden m-2 self-start" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-serif text-primary">
            Painel Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full justify-start"
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
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
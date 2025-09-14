import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

interface AdminMobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminMobileNav({ activeSection, onSectionChange }: AdminMobileNavProps) {
  const activeItem = menuItems.find(item => item.id === activeSection);

  return (
    <div className="lg:hidden mb-4 sticky top-20 z-30 bg-background">
      <Select value={activeSection} onValueChange={onSectionChange}>
        <SelectTrigger className="w-full h-12 bg-background border-border">
          <SelectValue>
            <div className="flex items-center gap-3">
              {activeItem && <activeItem.icon className="h-5 w-5" />}
              <span className="font-medium">{activeItem?.label || "Selecione uma seção"}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {menuItems.map((item) => (
            <SelectItem key={item.id} value={item.id} className="h-12">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
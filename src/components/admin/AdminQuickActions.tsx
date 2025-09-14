import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart, Upload, Users } from "lucide-react";

interface AdminQuickActionsProps {
  onSectionChange: (section: string) => void;
}

export function AdminQuickActions({ onSectionChange }: AdminQuickActionsProps) {
  const quickActions = [
    {
      id: "products",
      label: "Produtos",
      icon: Package,
      description: "Gerenciar produtos",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      id: "orders", 
      label: "Pedidos",
      icon: ShoppingCart,
      description: "Ver pedidos",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      id: "import",
      label: "Importar",
      icon: Upload,
      description: "Importar produtos",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      id: "users",
      label: "Usuários",
      icon: Users,
      description: "Gerenciar usuários", 
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="lg:hidden mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Card key={action.id} className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                onClick={() => onSectionChange(action.id)}
                className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-secondary/50"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
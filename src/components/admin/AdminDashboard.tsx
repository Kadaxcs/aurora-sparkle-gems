import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar total de produtos
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Buscar total de pedidos
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        // Buscar total de usuários
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Buscar receita total
        const { data: revenueData } = await supabase
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid');

        const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          totalUsers: usersCount || 0,
          totalRevenue
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total de Produtos",
      value: stats.totalProducts,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Total de Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-green-600"
    },
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Receita Total",
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Implementação em desenvolvimento...</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Implementação em desenvolvimento...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OrderStatusTester from "./OrderStatusTester";
import { AdminAuditLog } from "./AdminAuditLog";

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
}

interface BestProduct {
  id: string;
  name: string;
  total_sold: number;
  revenue: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [bestProducts, setBestProducts] = useState<BestProduct[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch all data in parallel to reduce loading time
    Promise.all([
      fetchStats(),
      fetchRecentOrders(), 
      fetchBestProducts()
    ]);
  }, []);

  const fetchStats = async () => {
    try {
      // Execute all count queries in parallel
      const [
        { count: productsCount }, 
        { count: ordersCount }, 
        { count: usersCount },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').eq('payment_status', 'paid')
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalUsers: usersCount || 0,
        totalRevenue
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas",
        variant: "destructive",
      });
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, total, created_at')
        .in('payment_status', ['paid', 'pending'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos recentes:', error);
    }
  };

  const fetchBestProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products!inner(name),
          orders!inner(payment_status)
        `)
        .eq('orders.payment_status', 'paid');

      if (error) throw error;

      // Process data to get best selling products
      const productStats: { [key: string]: { name: string; total_sold: number; revenue: number } } = {};
      
      data?.forEach(item => {
        const productId = item.product_id;
        const productName = (item.products as any)?.name || 'Produto desconhecido';
        
        if (!productStats[productId]) {
          productStats[productId] = {
            name: productName,
            total_sold: 0,
            revenue: 0
          };
        }
        
        productStats[productId].total_sold += item.quantity;
        productStats[productId].revenue += item.quantity * item.price;
      });

      const bestProductsList = Object.entries(productStats)
        .map(([id, stats]) => ({
          id,
          ...stats
        }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 5);

      setBestProducts(bestProductsList);
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      processing: { label: "Processando", variant: "default" as const },
      shipped: { label: "Enviado", variant: "outline" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || 
      { label: status, variant: "secondary" as const };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const statCards = useMemo(() => [
    {
      title: "Total de Produtos",
      value: stats.totalProducts,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Vendas Realizadas", 
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
  ], [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das vendas efetivadas (apenas pedidos pagos)</p>
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
            <CardTitle className="text-card-foreground">Pedidos Recentes (Pagos/Pendentes)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        R$ {order.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Produtos Mais Vendidos (Apenas Vendas Pagas)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Vendidos</TableHead>
                  <TableHead>Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestProducts.length > 0 ? (
                  bestProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        {product.total_sold}
                      </TableCell>
                      <TableCell>
                        R$ {product.revenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum produto vendido
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <OrderStatusTester />
        <AdminAuditLog />
      </div>
    </div>
  );
}
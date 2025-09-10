import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_amount?: number;
  maximum_uses?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', couponId);

      if (error) throw error;

      setCoupons(coupons.map(c => 
        c.id === couponId ? { ...c, is_active: !currentStatus } : c
      ));

      toast({
        title: "Sucesso",
        description: `Cupom ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cupom",
        variant: "destructive",
      });
    }
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return `R$ ${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Cupons</h1>
          <p className="text-muted-foreground">Gerencie cupons de desconto</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cupons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Válido até</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium font-mono">
                    {coupon.code}
                  </TableCell>
                  <TableCell>
                    {formatDiscount(coupon.discount_type, coupon.discount_value)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {coupon.used_count}
                      {coupon.maximum_uses && ` / ${coupon.maximum_uses}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at 
                      ? new Date(coupon.expires_at).toLocaleDateString('pt-BR')
                      : "Sem expiração"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={coupon.is_active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                    >
                      {coupon.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
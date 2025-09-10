import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, ShoppingBag, BarChart3 } from "lucide-react";

const adminFeatures = [
  {
    icon: ShoppingBag,
    title: "Gestão de Produtos",
    description: "Gerencie catálogo, preços e estoque",
    color: "text-blue-500"
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    description: "Acompanhe pedidos e perfis de usuários",
    color: "text-green-500"
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Acompanhe vendas e métricas",
    color: "text-purple-500"
  },
  {
    icon: Settings,
    title: "Configurações",
    description: "Personalize categorias e cupons",
    color: "text-orange-500"
  }
];

export function AdminAccess() {
  return (
    <section className="py-20 bg-gradient-luxury">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            Área Administrativa
          </Badge>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Painel de Controle
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Acesse o painel administrativo para gerenciar sua loja de joias
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {adminFeatures.map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all">
              <CardContent className="p-6 text-center">
                <feature.icon className={`h-12 w-12 mx-auto mb-4 ${feature.color}`} />
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            asChild
            size="lg"
            className="bg-gradient-gold hover:opacity-90 text-hero-bg font-semibold"
          >
            <Link to="/admin/login">
              Acessar Painel Administrativo
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
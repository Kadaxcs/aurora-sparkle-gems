import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Upload, RefreshCw, ShoppingCart, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  message: string;
  totalSynced?: number;
  error?: string;
}

export const LojaIntegradaSync = () => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: SyncResult }>({});
  const { toast } = useToast();

  const callEdgeFunction = async (action: string, data?: any) => {
    const { data: result, error } = await supabase.functions.invoke('loja-integrada-sync', {
      body: { action, data }
    });

    if (error) {
      throw new Error(error.message);
    }

    return result;
  };

  const handleSync = async (action: string, loadingKey: string, successMessage: string) => {
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    setResults(prev => ({ ...prev, [loadingKey]: { message: '', totalSynced: 0 } }));

    try {
      const result = await callEdgeFunction(action);
      
      setResults(prev => ({ 
        ...prev, 
        [loadingKey]: { 
          message: result.message || successMessage,
          totalSynced: result.totalSynced 
        } 
      }));

      toast({
        title: "Sucesso!",
        description: result.message || successMessage,
      });
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setResults(prev => ({ 
        ...prev, 
        [loadingKey]: { 
          message: '',
          error: errorMessage 
        } 
      }));

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const syncOptions = [
    {
      key: 'products_from_loja',
      action: 'sync_products_from_loja',
      title: 'Importar Produtos',
      description: 'Importar produtos da Loja Integrada para o sistema',
      icon: Download,
      color: 'bg-blue-500',
    },
    {
      key: 'products_to_loja',
      action: 'sync_products_to_loja', 
      title: 'Exportar Produtos',
      description: 'Exportar produtos do sistema para a Loja Integrada',
      icon: Upload,
      color: 'bg-green-500',
    },
    {
      key: 'orders_from_loja',
      action: 'sync_orders_from_loja',
      title: 'Importar Pedidos',
      description: 'Importar pedidos da Loja Integrada para o sistema',
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integração Loja Integrada</h2>
        <p className="text-muted-foreground">
          Sincronize produtos, pedidos e estoque entre seu sistema e a Loja Integrada
        </p>
      </div>

      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Certifique-se de que as chaves de API da Loja Integrada estão configuradas corretamente.
          A sincronização pode demorar alguns minutos dependendo da quantidade de dados.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {syncOptions.map((option) => {
          const Icon = option.icon;
          const isLoading = loading[option.key];
          const result = results[option.key];

          return (
            <Card key={option.key} className="relative">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${option.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleSync(option.action, option.key, `${option.title} concluído!`)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sincronizar
                    </>
                  )}
                </Button>

                {result && (
                  <div className="space-y-2">
                    {result.error ? (
                      <Alert variant="destructive">
                        <AlertDescription>{result.error}</AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          {result.message}
                          {result.totalSynced && (
                            <Badge variant="secondary" className="ml-2">
                              {result.totalSynced} itens
                            </Badge>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração da API</CardTitle>
          <CardDescription>
            Para usar a integração, você precisa configurar as chaves de API da Loja Integrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Passos para configurar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse sua conta na Loja Integrada</li>
              <li>Vá em Configurações → Chave para API</li>
              <li>Clique em "Cadastrar nova chave"</li>
              <li>Configure as chaves no painel de administração</li>
            </ol>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Nota:</strong> As chaves de API são armazenadas de forma segura no Supabase.
              Você precisa ter permissões de administrador para configurá-las.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, ExternalLink } from "lucide-react";

export const ImportExample = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Como usar o importador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>URL de exemplo:</strong> Use a URL da categoria de anéis da HubJoias para testar a importação.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-semibold">URLs sugeridas para importação:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Badge variant="outline">Anéis</Badge>
              <code className="text-sm flex-1">https://www.hubjoias.com.br/categoria-produto/aneis/</code>
              <ExternalLink className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Badge variant="outline">Brincos</Badge>
              <code className="text-sm flex-1">https://www.hubjoias.com.br/categoria-produto/brincos/</code>
              <ExternalLink className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Badge variant="outline">Colares</Badge>
              <code className="text-sm flex-1">https://www.hubjoias.com.br/categoria-produto/colares/</code>
              <ExternalLink className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Processo de importação:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Cole a URL da categoria de produtos da HubJoias</li>
            <li>Clique em "Extrair da URL" para buscar os produtos</li>
            <li>Selecione a categoria onde os produtos serão importados</li>
            <li>Escolha quais produtos importar marcando/desmarcando</li>
            <li>Clique em "Importar Produtos Selecionados"</li>
            <li>Os produtos serão criados como inativos com preço de custo</li>
            <li>Você poderá revisar e definir os preços de venda na seção "Produtos"</li>
          </ol>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Importante:</strong> Os produtos importados terão o status "inativo" por padrão. 
            Isso permite que você revise todas as informações e defina os preços de venda antes de disponibilizá-los na loja.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
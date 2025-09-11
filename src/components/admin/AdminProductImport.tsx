import { ProductImporterComponent } from "./ProductImporter";

export function AdminProductImport() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Importar Produtos</h1>
        <p className="text-muted-foreground">Importe produtos automaticamente do site da HubJoias</p>
      </div>

      <ProductImporterComponent />
    </div>
  );
}
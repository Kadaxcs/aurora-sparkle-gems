import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Save, X } from "lucide-react";

interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_active: boolean;
}

export function AdminPages() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PageData>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Erro ao buscar páginas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as páginas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (page: PageData) => {
    setEditingPage(page.id);
    setEditForm(page);
  };

  const cancelEditing = () => {
    setEditingPage(null);
    setEditForm({});
  };

  const savePage = async () => {
    if (!editingPage || !editForm) return;

    try {
      const { error } = await supabase
        .from('pages')
        .update({
          title: editForm.title,
          content: editForm.content,
          meta_description: editForm.meta_description,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPage);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Página atualizada com sucesso.",
      });

      await fetchPages();
      setEditingPage(null);
      setEditForm({});
    } catch (error) {
      console.error('Erro ao salvar página:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a página.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-primary">Páginas Institucionais</h2>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Páginas Institucionais</h2>
      </div>

      <div className="grid gap-6">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {page.title}
                    {!page.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        Inativo
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    /{page.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  {editingPage === page.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={savePage}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(page)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {editingPage === page.id ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="meta_description">Meta Descrição</Label>
                    <Input
                      id="meta_description"
                      value={editForm.meta_description || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Descrição para SEO (até 160 caracteres)"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      value={editForm.content || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={10}
                      placeholder="Conteúdo da página (suporta Markdown básico)"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editForm.is_active}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Página ativa</Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {page.meta_description}
                  </p>
                  <div className="text-sm bg-muted p-3 rounded">
                    {page.content.substring(0, 200)}...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
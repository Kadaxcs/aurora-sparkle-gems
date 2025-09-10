import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
}

export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Erro ao buscar página:', error);
          return;
        }

        setPage(data);
        
        // Update page title and meta description
        if (data) {
          document.title = `${data.title} - Bella Aurora`;
          
          // Update meta description
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', data.meta_description || '');
          } else {
            const newMeta = document.createElement('meta');
            newMeta.name = 'description';
            newMeta.content = data.meta_description || '';
            document.head.appendChild(newMeta);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar página:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Página não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A página que você está procurando não existe ou foi removida.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-8 text-gold hover:text-gold-dark">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
          
          <article className="space-y-8">
            <header className="text-center space-y-4 pb-8 border-b border-gold/20">
              <h1 className="text-5xl font-serif font-bold bg-gradient-gold bg-clip-text text-transparent">
                {page.title}
              </h1>
              <div className="w-24 h-[2px] bg-gradient-gold mx-auto"></div>
            </header>
            
            <div className="prose prose-lg max-w-none">
              <div 
                className="formatted-content space-y-6 text-base leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ 
                  __html: page.content
                    // Quebra dupla vira parágrafo
                    .replace(/\n\n+/g, '</p><p class="mb-6 text-gray-700 leading-relaxed">')
                    // Quebra simples vira <br>
                    .replace(/\n/g, '<br />')
                    // Títulos com ##
                    .replace(/##\s*(.*?)(?=<br|$)/g, '<h2 class="text-3xl font-serif font-semibold mt-12 mb-6 text-gold border-b border-gold/20 pb-3">$1</h2>')
                    // Títulos com ###
                    .replace(/###\s*(.*?)(?=<br|$)/g, '<h3 class="text-2xl font-serif font-semibold mt-8 mb-4 text-gold">$1</h3>')
                    // Negrito
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gold font-semibold">$1</strong>')
                    // Listas começando com -
                    .replace(/(?:^|\n)(-\s+.*?)(?=\n(?![^\n]*^-\s)|$)/gms, (match) => {
                      const items = match.trim().split('\n').map(item => 
                        item.replace(/^-\s+/, '<li class="mb-2 text-gray-700">') + '</li>'
                      ).join('');
                      return '<ul class="list-disc pl-8 space-y-2 mb-6 text-gray-700">' + items + '</ul>';
                    })
                    // Listas numeradas
                    .replace(/(?:^|\n)(\d+\.\s+.*?)(?=\n(?![^\n]*^\d+\.\s)|$)/gms, (match) => {
                      const items = match.trim().split('\n').map(item => 
                        item.replace(/^\d+\.\s+/, '<li class="mb-2 text-gray-700">') + '</li>'
                      ).join('');
                      return '<ol class="list-decimal pl-8 space-y-2 mb-6 text-gray-700">' + items + '</ol>';
                    })
                    // Texto restante em parágrafos
                    .replace(/^(?!<[hou]|<\/[hou]|<li|<\/li)(.+)$/gm, '<p class="mb-6 text-gray-700 leading-relaxed">$1</p>')
                    // Limpar tags vazias
                    .replace(/<p[^>]*><\/p>/g, '')
                    .replace(/<p[^>]*>\s*<\/p>/g, '')
                }}
              />
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
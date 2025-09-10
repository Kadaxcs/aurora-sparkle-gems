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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
          
          <article className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-serif font-bold text-primary mb-6">
              {page.title}
            </h1>
            
            <div 
              className="content text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: page.content.replace(/\n/g, '<br />').replace(/##\s*(.*)/g, '<h2 class="text-2xl font-semibold mt-8 mb-4 text-primary">$1</h2>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^\-\s+(.*)/gm, '<li class="ml-4">$1</li>').replace(/(<li.*>.*<\/li>)/s, '<ul class="list-disc pl-6 space-y-2 mb-4">$1</ul>') 
              }}
            />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
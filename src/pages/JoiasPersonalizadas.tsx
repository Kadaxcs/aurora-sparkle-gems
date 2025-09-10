import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Heart, Crown } from "lucide-react";
import { Link } from "react-router-dom";

export default function JoiasPersonalizadas() {
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
          
          <article className="space-y-12">
            <header className="text-center space-y-6 pb-12 border-b border-gold/20">
              <h1 className="text-5xl font-serif font-bold bg-gradient-gold bg-clip-text text-transparent">
                Joias Personalizadas
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Transforme seus sonhos em realidade com nossas joias exclusivas, 
                criadas especialmente para você
              </p>
              <div className="w-24 h-[2px] bg-gradient-gold mx-auto"></div>
            </header>

            <section className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-b from-gold/5 to-transparent border border-gold/10">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-gold">Design Único</h3>
                <p className="text-gray-600 leading-relaxed">
                  Cada peça é criada exclusivamente para você, seguindo seus gostos e preferências pessoais.
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-b from-gold/5 to-transparent border border-gold/10">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-gold">Significado Especial</h3>
                <p className="text-gray-600 leading-relaxed">
                  Incorporamos histórias, datas importantes e símbolos que representam momentos únicos.
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-b from-gold/5 to-transparent border border-gold/10">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-gold">Qualidade Premium</h3>
                <p className="text-gray-600 leading-relaxed">
                  Utilizamos apenas materiais de alta qualidade e técnicas artesanais refinadas.
                </p>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-serif font-semibold text-gold text-center border-b border-gold/20 pb-4">
                Como Funciona
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gold mb-2">Consulta Inicial</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Conversamos sobre suas ideias, orçamento e prazos para entender perfeitamente sua visão.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gold mb-2">Design & Aprovação</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Criamos esboços detalhados e apresentamos opções para sua aprovação antes da produção.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gold mb-2">Produção Artesanal</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Nossa equipe especializada confecciona sua joia com máxima atenção aos detalhes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gold mb-2">Entrega Especial</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Sua joia única é entregue em embalagem especial, pronta para momentos inesquecíveis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-gold/10 to-champagne/10 rounded-lg p-8 text-center">
              <h2 className="text-3xl font-serif font-semibold text-gold mb-4">
                Pronto para Criar Sua Joia dos Sonhos?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Entre em contato conosco e vamos juntos dar vida à joia perfeita que conta sua história única.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-gold hover:bg-gold-dark text-white font-semibold px-8 py-3">
                  Iniciar Consulta
                </Button>
                <Button variant="outline" className="border-gold text-gold hover:bg-gold/10 px-8 py-3">
                  Ver Portfólio
                </Button>
              </div>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
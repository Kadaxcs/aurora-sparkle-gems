import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Droplets, Sun, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function CuidadosJoias() {
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
                Cuidados com suas Joias
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Mantenha suas joias sempre brilhantes e preserve sua beleza por gerações
              </p>
              <div className="w-24 h-[2px] bg-gradient-gold mx-auto"></div>
            </header>

            <section className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6 p-6 rounded-lg bg-gradient-to-b from-gold/5 to-transparent border border-gold/10">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-gold" />
                  <h3 className="text-2xl font-serif font-semibold text-gold">Limpeza Regular</h3>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="leading-relaxed">
                    <strong className="text-gold">Ouro e Prata:</strong> Use água morna com algumas gotas de detergente neutro. 
                    Escove delicadamente com uma escova de dentes macia.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-gold">Pedras Preciosas:</strong> Limpe com pano macio e seco. 
                    Para limpeza mais profunda, use água destilada.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-gold">Frequência:</strong> Limpe suas joias semanalmente ou após cada uso 
                    em ocasiões especiais.
                  </p>
                </div>
              </div>

              <div className="space-y-6 p-6 rounded-lg bg-gradient-to-b from-gold/5 to-transparent border border-gold/10">
                <div className="flex items-center space-x-3">
                  <Droplets className="h-8 w-8 text-gold" />
                  <h3 className="text-2xl font-serif font-semibold text-gold">Armazenamento</h3>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p className="leading-relaxed">
                    <strong className="text-gold">Local Seco:</strong> Guarde em local seco, longe da umidade. 
                    Use sílica gel se necessário.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-gold">Separação:</strong> Mantenha cada peça em compartimento individual 
                    para evitar riscos.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-gold">Estojo Adequado:</strong> Use estojos forrados com veludo ou 
                    flanela para proteção extra.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-serif font-semibold text-gold text-center border-b border-gold/20 pb-4">
                O que Evitar
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-lg border border-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-red-700 mb-2">Produtos Químicos</h4>
                      <p className="text-red-600 leading-relaxed text-sm">
                        Evite contato com perfumes, cremes, produtos de limpeza e cloro. 
                        Aplique cosméticos antes de colocar as joias.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <Sun className="h-6 w-6 text-orange-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-orange-700 mb-2">Exposição Extrema</h4>
                      <p className="text-orange-600 leading-relaxed text-sm">
                        Não deixe suas joias expostas ao sol forte por longos períodos. 
                        Algumas pedras podem desbotar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Droplets className="h-6 w-6 text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-blue-700 mb-2">Atividades Físicas</h4>
                      <p className="text-blue-600 leading-relaxed text-sm">
                        Remova as joias antes de exercícios, natação, limpeza doméstica 
                        ou trabalhos manuais.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <Shield className="h-6 w-6 text-purple-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg text-purple-700 mb-2">Impactos</h4>
                      <p className="text-purple-600 leading-relaxed text-sm">
                        Evite quedas e impactos que podem danificar as estruturas 
                        delicadas das suas joias.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-serif font-semibold text-gold text-center border-b border-gold/20 pb-4">
                Dicas por Material
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-lg border border-gold/20 space-y-4">
                  <h4 className="text-xl font-serif font-semibold text-gold">Ouro</h4>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li>• Resistente, mas pode riscar</li>
                    <li>• Limpe com água morna e sabão neutro</li>
                    <li>• Seque completamente após limpeza</li>
                    <li>• Polimento profissional anual</li>
                  </ul>
                </div>

                <div className="p-6 rounded-lg border border-gold/20 space-y-4">
                  <h4 className="text-xl font-serif font-semibold text-gold">Prata</h4>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li>• Pode oxidar naturalmente</li>
                    <li>• Use flanela especial para polir</li>
                    <li>• Guarde em saco plástico fechado</li>
                    <li>• Evite umidade excessiva</li>
                  </ul>
                </div>

                <div className="p-6 rounded-lg border border-gold/20 space-y-4">
                  <h4 className="text-xl font-serif font-semibold text-gold">Pedras</h4>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li>• Cada pedra tem cuidados específicos</li>
                    <li>• Pérolas são mais delicadas</li>
                    <li>• Esmeraldas precisam cuidado extra</li>
                    <li>• Diamantes são resistentes a riscos</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-gold/10 to-champagne/10 rounded-lg p-8 text-center">
              <h2 className="text-3xl font-serif font-semibold text-gold mb-4">
                Precisa de Ajuda Profissional?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Nossa equipe oferece serviços de limpeza, polimento e restauração profissional 
                para manter suas joias sempre perfeitas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-gold hover:bg-gold-dark text-white font-semibold px-8 py-3">
                  Agendar Serviço
                </Button>
                <Button variant="outline" className="border-gold text-gold hover:bg-gold/10 px-8 py-3">
                  Falar com Especialista
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
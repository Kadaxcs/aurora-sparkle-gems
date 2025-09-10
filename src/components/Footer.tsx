import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-gradient-dark text-white mt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <h3 className="text-2xl font-serif bg-gradient-gold bg-clip-text text-transparent">
              Bella Aurora
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Criamos joias únicas que celebram momentos especiais e expressam sua individualidade com elegância atemporal.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="hover:bg-white/10">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-white/10">
                <Facebook className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-serif text-gold text-xl font-semibold tracking-wide">
              Links Rápidos
            </h4>
            <nav className="grid grid-cols-1 gap-4">
              <Link 
                to="/page/sobre-nos" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Sobre Nós
              </Link>
              <Link 
                to="/aneis" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Anéis
              </Link>
              <Link 
                to="/brincos" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Brincos
              </Link>
              <Link 
                to="/colares" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Colares
              </Link>
              <Link 
                to="/pulseiras" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Pulseiras
              </Link>
              <Link 
                to="/conjuntos" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Conjuntos
              </Link>
              <Link 
                to="/joias-personalizadas" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Joias Personalizadas
              </Link>
              <Link 
                to="/cuidados-joias" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Cuidados com as Joias
              </Link>
            </nav>
          </div>

          {/* Atendimento */}
          <div className="space-y-6">
            <h4 className="font-serif text-gold text-xl font-semibold tracking-wide">Atendimento</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gold" />
                <span className="text-gray-300">(51) 9 8176-5717</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gold" />
                <span className="text-gray-300">contato@bellaaurorajoias.com.br</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gold mt-0.5" />
                <span className="text-gray-300">
                  Centro, Osório - RS
                </span>
              </li>
            </ul>
          </div>

          {/* Políticas */}
          <div className="space-y-6">
            <h4 className="font-serif text-gold text-xl font-semibold tracking-wide">Políticas</h4>
            <nav className="grid grid-cols-1 gap-4">
              <Link 
                to="/page/politica-privacidade" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Política de Privacidade
              </Link>
              <Link 
                to="/page/termos-condicoes" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Termos e Condições
              </Link>
              <Link 
                to="/page/politica-troca-devolucao" 
                className="group flex items-center text-gray-300 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <span className="w-2 h-[1px] bg-gold mr-3 transition-all duration-300 group-hover:w-4"></span>
                Trocas e Devoluções
              </Link>
            </nav>
            <div className="pt-4 border-t border-gold/20">
              <p className="text-sm text-gray-400 leading-relaxed font-medium">
                💎 Envios para todo o Brasil com segurança e agilidade<br/>
                🏆 Parcele em até 12x sem juros
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
          <div className="text-sm text-gray-300">
            © 2024 Bella Aurora Joias. Todos os direitos reservados.
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
            <span className="text-gray-400">💎 Joias autênticas com certificado</span>
            <span className="text-gray-400">🚚 Frete grátis acima de R$ 200</span>
            <span className="text-gray-400">🔒 Compra 100% segura</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
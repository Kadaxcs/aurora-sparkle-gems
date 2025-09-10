import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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

          {/* Links Rápidos */}
          <div className="space-y-4">
            <h4 className="font-medium text-gold">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-300 hover:text-gold transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-gold transition-colors">
                  Coleções
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-gold transition-colors">
                  Joias Personalizadas
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-gold transition-colors">
                  Cuidados com as Joias
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-gold transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Atendimento */}
          <div className="space-y-4">
            <h4 className="font-medium text-gold">Atendimento</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gold" />
                <span className="text-gray-300">(11) 99999-9999</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gold" />
                <span className="text-gray-300">contato@bellaaurorajoias.com.br</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gold mt-0.5" />
                <span className="text-gray-300">
                  Rua das Joias, 123<br />
                  Centro, São Paulo - SP
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-medium text-gold">Newsletter</h4>
            <p className="text-sm text-gray-300">
              Receba novidades sobre nossas coleções e promoções exclusivas.
            </p>
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Seu email"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Button className="w-full bg-gradient-gold hover:opacity-90 text-black font-medium">
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-300">
            © 2024 Bella Aurora Joias. Todos os direitos reservados.
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-gray-300 hover:text-gold transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="text-gray-300 hover:text-gold transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-gray-300 hover:text-gold transition-colors">
              Trocas e Devoluções
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
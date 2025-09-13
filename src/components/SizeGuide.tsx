import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Ruler, Hand, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface SizeGuideProps {
  children: React.ReactNode;
}

export const SizeGuide = ({ children }: SizeGuideProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const sizeChart = [
    { size: 12, circumference: "51.8mm", diameter: "16.5mm" },
    { size: 13, circumference: "53.4mm", diameter: "17.0mm" },
    { size: 14, circumference: "55.1mm", diameter: "17.5mm" },
    { size: 15, circumference: "56.7mm", diameter: "18.0mm" },
    { size: 16, circumference: "58.3mm", diameter: "18.5mm" },
    { size: 17, circumference: "59.9mm", diameter: "19.1mm" },
    { size: 18, circumference: "61.6mm", diameter: "19.6mm" },
    { size: 19, circumference: "63.2mm", diameter: "20.1mm" },
    { size: 20, circumference: "64.8mm", diameter: "20.6mm" },
    { size: 21, circumference: "66.5mm", diameter: "21.2mm" },
    { size: 22, circumference: "68.1mm", diameter: "21.7mm" },
    { size: 23, circumference: "69.7mm", diameter: "22.2mm" },
    { size: 24, circumference: "71.4mm", diameter: "22.7mm" },
    { size: 25, circumference: "73.0mm", diameter: "23.2mm" },
  ];

  const methods = [
    {
      id: "string",
      title: "Método do Barbante ou Fita",
      icon: <Ruler className="h-5 w-5" />,
      difficulty: "Fácil",
      accuracy: "Alta",
      steps: [
        "Pegue um pedaço de barbante ou fita métrica flexível",
        "Enrole ao redor do dedo onde usará o anel",
        "Marque onde o barbante se encontra",
        "Meça o comprimento marcado com uma régua",
        "Compare com a tabela de medidas abaixo"
      ]
    },
    {
      id: "existing",
      title: "Método do Anel Existente",
      icon: <Hand className="h-5 w-5" />,
      difficulty: "Muito Fácil",
      accuracy: "Muito Alta",
      steps: [
        "Pegue um anel que já serve perfeitamente no dedo desejado",
        "Meça o diâmetro interno do anel com uma régua",
        "Compare a medida com a coluna 'Diâmetro' na tabela abaixo",
        "Se não tiver régua, leve o anel a uma joalheria para verificar o tamanho"
      ]
    }
  ];

  const tips = [
    "Meça o dedo no final do dia, quando está ligeiramente inchado",
    "Certifique-se que o anel passe pela articulação confortavelmente",
    "Em caso de dúvida entre dois tamanhos, escolha o maior",
    "Considere a largura do anel - anéis mais largos precisam ser ligeiramente maiores",
    "Evite medir quando estiver com frio ou calor extremo"
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-center">
            Guia de Tamanhos de Anéis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Métodos de Medição */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              Métodos para Descobrir seu Tamanho
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {methods.map((method) => (
                <Card 
                  key={method.id}
                  className={`cursor-pointer transition-all ${
                    selectedMethod === method.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedMethod(selectedMethod === method.id ? null : method.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {method.icon}
                        {method.title}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {method.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {method.accuracy}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {selectedMethod === method.id && (
                    <CardContent>
                      <ol className="space-y-2">
                        {method.steps.map((step, index) => (
                          <li key={index} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tabela de Tamanhos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tabela de Medidas</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-3 text-left font-semibold">Tamanho</th>
                    <th className="border border-border p-3 text-left font-semibold">Circunferência</th>
                    <th className="border border-border p-3 text-left font-semibold">Diâmetro</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.map((size, index) => (
                    <tr key={size.size} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                      <td className="border border-border p-3 font-semibold">{size.size}</td>
                      <td className="border border-border p-3">{size.circumference}</td>
                      <td className="border border-border p-3">{size.diameter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Dicas Importantes */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Dicas Importantes
            </h3>
            <div className="space-y-3">
              {tips.map((tip, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Horário Ideal */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Melhor Horário para Medir</h4>
                  <p className="text-sm text-blue-800">
                    O final da tarde (entre 16h e 18h) é o momento ideal para medir seu dedo, 
                    pois é quando ele está em seu tamanho natural, nem muito inchado nem muito contraído.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garantia */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Garantia de Tamanho</h4>
                  <p className="text-sm text-green-800">
                    Se o anel não servir perfeitamente, fazemos o ajuste gratuito dentro de 30 dias. 
                    Nosso compromisso é que você fique 100% satisfeita com sua joia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Ainda com dúvidas? Entre em contato conosco pelo WhatsApp que te ajudamos!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
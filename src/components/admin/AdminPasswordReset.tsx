import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function AdminPasswordReset() {
  const [email, setEmail] = useState("kadaxyz1@gmail.com");
  const [newPassword, setNewPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('reset-admin-password', {
        body: {
          email,
          newPassword
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Senha do administrador resetada com sucesso.",
      });

    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao resetar senha do administrador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset de Senha Admin</CardTitle>
        <CardDescription>
          Resetar senha do administrador do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email do Admin</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Nova Senha</Label>
          <Input
            id="password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleReset} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Resetando..." : "Resetar Senha"}
        </Button>
      </CardContent>
    </Card>
  );
}
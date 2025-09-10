import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

export function UserProfileDialog({ 
  open, 
  onOpenChange, 
  user, 
  profile, 
  onProfileUpdate 
}: UserProfileDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const profileData = {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        updated_at: new Date().toISOString(),
      };

      if (profile) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Criar novo perfil
        const { error } = await supabase
          .from('profiles')
          .insert([{
            ...profileData,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      onProfileUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Minha Conta</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais aqui.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              value={user?.email || ""}
              className="col-span-3"
              disabled
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              Nome
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="col-span-3"
              placeholder="Seu primeiro nome"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Sobrenome
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="col-span-3"
              placeholder="Seu sobrenome"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Telefone
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
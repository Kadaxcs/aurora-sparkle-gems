import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function AdminAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs de auditoria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('role_change')) return 'destructive';
    if (action.includes('create')) return 'default';
    if (action.includes('update')) return 'secondary';
    if (action.includes('delete')) return 'outline';
    return 'default';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Log de Auditoria</CardTitle>
          <CardDescription>Carregando logs de segurança...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de Auditoria de Segurança</CardTitle>
        <CardDescription>
          Registro de todas as ações administrativas críticas para segurança
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum log de auditoria encontrado
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Alterações</TableHead>
                  <TableHead>Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {log.target_table || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.old_values && log.new_values && (
                        <div className="text-sm space-y-1">
                          {Object.keys(log.new_values).map((key) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium">{key}:</span>
                              <span className="text-red-600">
                                {JSON.stringify(log.old_values[key])}
                              </span>
                              <span>→</span>
                              <span className="text-green-600">
                                {JSON.stringify(log.new_values[key])}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.admin_user_id.slice(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const key = `reset_${ip}`;
  const limit = rateLimitStore.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return false;
  }

  if (limit.count >= 3) {
    return true;
  }

  limit.count++;
  return false;
};

const validatePassword = (password: string): string | null => {
  if (password.length < 12) {
    return "A senha deve ter pelo menos 12 caracteres.";
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
    return "A senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial.";
  }
  return null;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limiting
    if (isRateLimited(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get authorization header to verify admin is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Faça login como administrador.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the token and check if user is admin
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Invalid token or user not found:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido. Faça login novamente.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if the authenticated user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      console.log(`User ${user.email} is not authorized as admin`);
      return new Response(
        JSON.stringify({ error: 'Usuário não autorizado como administrador.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, newPassword } = await req.json();

    console.log(`Admin ${user.email} attempting password reset for: ${email}`);

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return new Response(
        JSON.stringify({ error: passwordError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se o usuário que está sendo resetado também é admin
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('role, user_id')
      .eq('user_id', (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || '')
      .single();

    if (targetProfileError || targetProfile?.role !== 'admin') {
      console.log(`Password reset attempted for non-admin email: ${email}`);
      return new Response(
        JSON.stringify({ error: 'Senha só pode ser resetada para usuários administradores' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Atualizar a senha usando o Supabase Admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || '',
      { password: newPassword }
    );

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Senha atualizada com sucesso para:', email);

    return new Response(
      JSON.stringify({ success: true, message: 'Senha atualizada com sucesso' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no reset de senha:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
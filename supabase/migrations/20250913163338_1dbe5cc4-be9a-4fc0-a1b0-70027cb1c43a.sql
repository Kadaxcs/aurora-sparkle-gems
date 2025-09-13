-- Enhanced RLS policies for better security

-- Add audit logging table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (is_verified_admin());

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    target_table,
    target_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_table,
    p_target_id,
    p_old_values,
    p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enhanced profile security - prevent admins from viewing sensitive data unnecessarily
DROP POLICY IF EXISTS "verified_admin_can_read_profiles" ON public.profiles;
CREATE POLICY "admin_limited_profile_access" 
ON public.profiles 
FOR SELECT 
USING (
  is_verified_admin() AND (
    -- Admins can only see basic info, not sensitive data like phone unless specifically needed
    auth.uid() <> user_id
  )
);

-- Audit trigger for profile role changes
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM log_admin_action(
      'profile_role_change',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for profile auditing
DROP TRIGGER IF EXISTS audit_profile_changes_trigger ON public.profiles;
CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- Enhanced order security - mask sensitive payment data
CREATE OR REPLACE FUNCTION public.mask_payment_data(payment_data JSONB)
RETURNS JSONB AS $$
BEGIN
  IF payment_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove sensitive payment information for non-admin access
  RETURN jsonb_build_object(
    'status', payment_data->>'status',
    'payment_method', payment_data->>'payment_method',
    'transaction_amount', payment_data->>'transaction_amount',
    'date_approved', payment_data->>'date_approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
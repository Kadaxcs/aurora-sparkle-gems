-- Fix remaining security linter warnings with simpler approach

-- Fix function search_path issues for specific functions
ALTER FUNCTION public.audit_profile_changes() SET search_path = public;
ALTER FUNCTION public.mask_payment_data(jsonb) SET search_path = public;

-- Update existing functions that need search_path (avoiding the ambiguous column issue)
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_verified_admin() SET search_path = public;
ALTER FUNCTION public.sanitize_profile_for_display(uuid, text, text, text) SET search_path = public;
ALTER FUNCTION public.notify_paid_order() SET search_path = public;
ALTER FUNCTION public.notify_order_updates() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.generate_order_number() SET search_path = public;
ALTER FUNCTION public.make_specific_emails_admin() SET search_path = public;
ALTER FUNCTION public.validate_order_user_id() SET search_path = public;
ALTER FUNCTION public.log_admin_action(text, text, uuid, jsonb, jsonb) SET search_path = public;
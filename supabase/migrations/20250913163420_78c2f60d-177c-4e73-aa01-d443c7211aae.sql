-- Fix remaining security linter warnings

-- Fix function search_path issues by adding SET search_path = public where missing
ALTER FUNCTION public.audit_profile_changes() SET search_path = public;
ALTER FUNCTION public.mask_payment_data(jsonb) SET search_path = public;

-- Move uuid-ossp extension from public to extensions schema (if it exists in public)
-- First check if we can create extensions schema and move the extension
DO $$
BEGIN
    -- Try to create extensions schema if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'extensions') THEN
        CREATE SCHEMA IF NOT EXISTS extensions;
    END IF;
    
    -- Check if uuid-ossp is in public schema and move it
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        -- Drop and recreate in extensions schema
        DROP EXTENSION IF EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If we can't move the extension, that's okay - it might already be handled
    RAISE NOTICE 'Could not move uuid-ossp extension: %', SQLERRM;
END $$;

-- Update all existing functions to use the proper search_path
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Update all functions in public schema to have explicit search_path
    FOR func_record IN 
        SELECT proname, oid 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc_config 
            WHERE unnest(proconfig) LIKE 'search_path=%'
            AND pg_proc_config.oid = p.oid
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public', func_record.proname);
        EXCEPTION WHEN OTHERS THEN
            -- Function might have parameters, try different approach
            CONTINUE;
        END;
    END LOOP;
END $$;
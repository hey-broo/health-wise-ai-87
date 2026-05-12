
-- Remove the buggy duplicate that always returned true
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- Grant execute on the correct has_role function to all relevant roles
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

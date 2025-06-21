
-- Create the get_user_roles function that returns user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS TABLE(role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role::TEXT
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id;
END;
$$;

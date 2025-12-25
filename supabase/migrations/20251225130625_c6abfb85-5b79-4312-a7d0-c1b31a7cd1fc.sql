-- Fix search_path for generate_username function
CREATE OR REPLACE FUNCTION public.generate_username()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- Generate base username from full_name or use first part of id
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
    base_username := lower(regexp_replace(NEW.full_name, '[^a-zA-Z0-9]', '-', 'g'));
    base_username := regexp_replace(base_username, '-+', '-', 'g');
    base_username := trim(both '-' from base_username);
  ELSE
    base_username := 'user-' || substring(NEW.id::text from 1 for 8);
  END IF;
  
  -- Ensure uniqueness
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username AND id != NEW.id) LOOP
    counter := counter + 1;
    final_username := base_username || '-' || counter;
  END LOOP;
  
  NEW.username := final_username;
  RETURN NEW;
END;
$$;
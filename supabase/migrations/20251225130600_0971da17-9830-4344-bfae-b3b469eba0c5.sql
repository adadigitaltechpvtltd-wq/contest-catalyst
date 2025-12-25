-- Add username column to profiles for SEO-friendly URLs
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create a trigger function to auto-generate username from full_name or user_id
CREATE OR REPLACE FUNCTION public.generate_username()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate username on insert if not provided
CREATE TRIGGER set_username_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.username IS NULL)
  EXECUTE FUNCTION public.generate_username();

-- Backfill existing profiles with usernames
UPDATE public.profiles 
SET username = CASE 
  WHEN full_name IS NOT NULL AND full_name != '' THEN
    lower(regexp_replace(
      regexp_replace(
        trim(both '-' from regexp_replace(full_name, '[^a-zA-Z0-9]', '-', 'g')),
        '-+', '-', 'g'
      ),
      '-+$', '', 'g'
    )) || '-' || substring(id::text from 1 for 4)
  ELSE
    'user-' || substring(id::text from 1 for 8)
  END
WHERE username IS NULL;
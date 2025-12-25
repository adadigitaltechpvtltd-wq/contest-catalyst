-- Create a trigger function to ensure only one contest is featured in hero at a time
CREATE OR REPLACE FUNCTION public.ensure_single_hero_contest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When a contest is being set as featured in hero
  IF NEW.featured_in_hero = true THEN
    -- Unfeature all other contests
    UPDATE public.contests
    SET featured_in_hero = false
    WHERE id != NEW.id
      AND featured_in_hero = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger on the contests table
DROP TRIGGER IF EXISTS ensure_single_hero_contest_trigger ON public.contests;

CREATE TRIGGER ensure_single_hero_contest_trigger
BEFORE INSERT OR UPDATE OF featured_in_hero ON public.contests
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_hero_contest();
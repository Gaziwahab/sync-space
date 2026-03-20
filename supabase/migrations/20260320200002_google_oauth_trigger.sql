-- Update the handle_new_user trigger to support Google OAuth users
-- Extracts display_name and avatar_url from Google's raw_user_meta_data

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = CASE
      WHEN profiles.display_name IS NULL OR profiles.display_name = ''
      THEN EXCLUDED.display_name
      ELSE profiles.display_name
    END,
    avatar_url = CASE
      WHEN profiles.avatar_url IS NULL OR profiles.avatar_url = ''
      THEN EXCLUDED.avatar_url
      ELSE profiles.avatar_url
    END;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
hello;

-- 1. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 2. RLS policies for avatars bucket
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- 3. Create prompt_versions table
CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  system_prompt TEXT NOT NULL DEFAULT '',
  user_message_template TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  variables JSONB NOT NULL DEFAULT '[]',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompt versions"
ON public.prompt_versions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompt versions"
ON public.prompt_versions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt versions"
ON public.prompt_versions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

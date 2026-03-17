
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL DEFAULT '',
  user_message_template TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompts" ON public.prompts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own prompts" ON public.prompts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON public.prompts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON public.prompts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

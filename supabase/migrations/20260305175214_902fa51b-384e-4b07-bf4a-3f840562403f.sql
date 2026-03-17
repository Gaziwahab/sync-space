
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL DEFAULT 'worker',
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI assistant.',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents" ON public.agents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own agents" ON public.agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON public.agents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agents" ON public.agents FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

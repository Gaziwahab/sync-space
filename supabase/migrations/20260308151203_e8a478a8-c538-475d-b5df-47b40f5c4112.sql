
-- project_messages: group chat messages per project
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL DEFAULT '',
  agent_role TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project messages" ON public.project_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project messages" ON public.project_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own project messages" ON public.project_messages FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to insert (edge function uses service role)
CREATE POLICY "Service role can insert project messages" ON public.project_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can select project messages" ON public.project_messages FOR SELECT USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- project_files: generated code files per project
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_by_agent TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, file_path)
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project files" ON public.project_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project files" ON public.project_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project files" ON public.project_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project files" ON public.project_files FOR DELETE USING (auth.uid() = user_id);

-- Allow service role access
CREATE POLICY "Service role can insert project files" ON public.project_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update project files" ON public.project_files FOR UPDATE USING (true);
CREATE POLICY "Service role can select project files" ON public.project_files FOR SELECT USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_files;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ApiKeyProvider = "openai" | "anthropic" | "gemini" | "openrouter";

export interface ApiKey {
  id: string;
  user_id: string;
  label: string;
  provider: ApiKeyProvider;
  api_key: string;
  created_at: string;
}

export const PROVIDER_LABELS: Record<ApiKeyProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
};

export const PROVIDER_COLORS: Record<ApiKeyProvider, string> = {
  openai: "emerald",
  anthropic: "orange",
  gemini: "blue",
  openrouter: "purple",
};

export const useApiKeys = () => {
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_api_keys" as any)
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as any) as ApiKey[];
    },
  });

  const addKey = useMutation({
    mutationFn: async (input: { label: string; provider: ApiKeyProvider; api_key: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload = {
        ...input,
        user_id: user.id,
      };
      
      const { error } = await supabase
        .from("user_api_keys" as any)
        .insert(payload);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_api_keys" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { apiKeys, isLoading, addKey, deleteKey };
};

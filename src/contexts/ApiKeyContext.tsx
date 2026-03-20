import React, { createContext, useContext, useState, useEffect } from "react";
import { useApiKeys, type ApiKey } from "@/hooks/useApiKeys";

export const PROVIDER_MODELS: Record<string, {value: string, label: string}[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  ],
  anthropic: [
    { value: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  ],
  gemini: [
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
  ],
  openrouter: [
    { value: "meta-llama/llama-3-70b-instruct", label: "Llama 3 70B" },
    { value: "mistralai/mixtral-8x7b-instruct", label: "Mixtral 8x7B" },
  ]
};

interface ApiKeyContextValue {
  apiKeys: ApiKey[];
  selectedKeyId: string | null;
  setSelectedKeyId: (id: string | null) => void;
  selectedKey: ApiKey | null;
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
  isLoading: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextValue>({
  apiKeys: [],
  selectedKeyId: null,
  setSelectedKeyId: () => {},
  selectedKey: null,
  selectedModel: null,
  setSelectedModel: () => {},
  isLoading: false,
});

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiKeys, isLoading } = useApiKeys();
  const [selectedKeyId, setSelectedKeyIdState] = useState<string | null>(() => {
    return localStorage.getItem("syncspace-active-api-key") || null;
  });
  const [selectedModel, setSelectedModelState] = useState<string | null>(() => {
    return localStorage.getItem("syncspace-active-model") || null;
  });

  // When keys load, if no selection or selected key no longer exists, pick the first
  useEffect(() => {
    if (apiKeys.length === 0) return;
    const exists = apiKeys.find((k) => k.id === selectedKeyId);
    if (!exists) {
      const firstId = apiKeys[0].id;
      const provider = apiKeys[0].provider;
      const defaultModel = PROVIDER_MODELS[provider]?.[0]?.value || null;
      
      setSelectedKeyIdState(firstId);
      localStorage.setItem("syncspace-active-api-key", firstId);
      
      setSelectedModelState(defaultModel);
      if (defaultModel) localStorage.setItem("syncspace-active-model", defaultModel);
    }
  }, [apiKeys, selectedKeyId]);

  const setSelectedKeyId = (id: string | null) => {
    setSelectedKeyIdState(id);
    if (id) {
      localStorage.setItem("syncspace-active-api-key", id);
      const key = apiKeys.find(k => k.id === id);
      if (key) {
        const defaultModel = PROVIDER_MODELS[key.provider]?.[0]?.value || null;
        setSelectedModelState(defaultModel);
        if (defaultModel) localStorage.setItem("syncspace-active-model", defaultModel);
      }
    } else {
      localStorage.removeItem("syncspace-active-api-key");
      setSelectedModelState(null);
      localStorage.removeItem("syncspace-active-model");
    }
  };

  const setSelectedModel = (model: string | null) => {
    setSelectedModelState(model);
    if (model) localStorage.setItem("syncspace-active-model", model);
    else localStorage.removeItem("syncspace-active-model");
  };

  const selectedKey = apiKeys.find((k) => k.id === selectedKeyId) ?? null;

  return (
    <ApiKeyContext.Provider value={{ apiKeys, selectedKeyId, setSelectedKeyId, selectedKey, selectedModel, setSelectedModel, isLoading }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKeyContext = () => useContext(ApiKeyContext);

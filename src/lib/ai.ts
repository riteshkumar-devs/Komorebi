import { GoogleGenAI } from "@google/genai";
import { UserProfile } from '../types';
import { safeStorage } from './utils';
import { db } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { AI_MODELS } from './constants';

let currentKeyIndex = 0;

export type AIPurpose = 'translation' | 'sensei' | 'dictionary' | 'general';

export const getApiKey = (profile?: UserProfile | null, purpose: AIPurpose = 'general') => {
  // 1. Try new structuredKeys first
  if (profile?.apiSettings?.structuredKeys) {
    const { mode, structuredKeys } = profile.apiSettings;
    
    // Try specific purpose first if in particular mode
    if (mode === 'particular' && purpose !== 'general') {
      const specificSet = 
        purpose === 'translation' ? structuredKeys.translation : 
        purpose === 'sensei' ? structuredKeys.sensei : 
        purpose === 'dictionary' ? structuredKeys.dictionary : 
        null;
      
      if (specificSet && specificSet.length > 0) {
        const validKeys = specificSet.filter(k => k.key.trim().length > 0);
        if (validKeys.length > 0) {
          const vk = validKeys[currentKeyIndex % validKeys.length];
          return { key: vk.key, provider: vk.provider, baseUrl: vk.baseUrl, model: vk.model };
        }
      }
    }
    
    // Fallback to universal keys (or use them if in universal mode)
    const universalSet = structuredKeys.universal;
    if (universalSet && universalSet.length > 0) {
      const validKeys = universalSet.filter(k => k.key.trim().length > 0);
      if (validKeys.length > 0) {
        const vk = validKeys[currentKeyIndex % validKeys.length];
        return { key: vk.key, provider: vk.provider, baseUrl: vk.baseUrl, model: vk.model };
      }
    }
  }

  // 2. Try environment variables
  const envKey = process.env.GEMINI_API_KEY || 
         process.env.GOOGLE_API_KEY ||
         (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (import.meta as any).env?.VITE_GOOGLE_API_KEY ||
         '';
  
  const trimmedEnvKey = envKey.trim();
  if (trimmedEnvKey && !trimmedEnvKey.includes('TODO') && trimmedEnvKey.length >= 10) {
    return { key: trimmedEnvKey, provider: 'gemini' as const };
  }

  // 3. Try localStorage (user manual entry)
  const localKey = typeof window !== 'undefined' ? safeStorage.getItem('komorebi_gemini_key') : null;
  if (localKey) return { key: localKey.trim(), provider: 'gemini' as const };

  return null;
};

export const getSafeModel = (provider?: string, requestedModel?: string) => {
  if (requestedModel && requestedModel.trim()) return requestedModel.trim();
  if (!provider) return 'gemini-2.0-flash';
  
  const prov = provider.toLowerCase();
  if (prov === 'openrouter') return 'openrouter/free';

  const models = AI_MODELS[prov];
  if (!models || models.length === 0) {
    return 'gemini-2.0-flash';
  }
  
  return models[0].id;
};

export const getAI = (profile?: UserProfile | null, purpose: AIPurpose = 'general') => {
  const keyInfo = getApiKey(profile, purpose);
  
  if (!keyInfo) {
    return null;
  }

  const model = keyInfo.model || getSafeModel(keyInfo.provider);

  return {
    models: {
      generateContent: async (params: any) => {
        const targetModel = params.model || model;
        let lastError: any = null;
        const maxRetries = 2;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (keyInfo.provider === 'gemini') {
              try {
                const ai = new GoogleGenAI({ apiKey: keyInfo.key });
                const response = await ai.models.generateContent({
                  model: targetModel,
                  contents: typeof params.contents === 'string' 
                    ? params.contents 
                    : params.contents,
                  config: params.config
                });
                
                const text = response.text || "";
                
                return { 
                  text: text, 
                  response: { text: () => text },
                  candidates: (response as any).candidates || [{ content: { parts: [{ text: text }] } }]
                };
              } catch (error: any) {
                let errorMsg = error.message || "Gemini request failed";
                if (errorMsg.includes("429") || errorMsg.includes("quota")) {
                  errorMsg = "Quota exceeded. Please try again later or use a different API key.";
                } else if (errorMsg.includes("API key")) {
                  errorMsg = "Invalid API key. Please check your settings.";
                }
                throw new Error(errorMsg);
              }
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 95000);

            try {
              const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                  provider: keyInfo.provider,
                  key: keyInfo.key,
                  baseUrl: (keyInfo as any).baseUrl,
                  model: targetModel,
                  contents: params.contents,
                  systemInstruction: params.config?.systemInstruction,
                  responseMimeType: params.config?.responseMimeType
                })
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                  try {
                    const errorData = await response.json();
                    let errorMsg = errorData.error || errorData.details || "AI request failed";
                    if (typeof errorMsg === 'object') errorMsg = JSON.stringify(errorMsg);
                    
                    if (errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("credit")) {
                      throw new Error("API Provider: Quota exceeded or insufficient credits.");
                    } else if (errorMsg.toLowerCase().includes("key") || errorMsg.toLowerCase().includes("unauthorized") || errorMsg.toLowerCase().includes("authentication") || response.status === 401) {
                      throw new Error("API Provider: Authentication failed or invalid API key. Please check your API key in Settings.");
                    } else if (errorMsg.toLowerCase().includes("timeout") || errorMsg.toLowerCase().includes("504")) {
                      if (attempt < maxRetries) {
                        console.warn(`Attempt ${attempt + 1} failed with timeout. Retrying...`);
                        continue;
                      }
                      throw new Error("AI Provider timed out (504). The service might be busy.");
                    }
                    throw new Error(errorMsg);
                  } catch (e: any) {
                    if (attempt < maxRetries && (e.message.includes("is not valid JSON") || e.message.includes("Unexpected token"))) {
                      continue; 
                    }
                    if (e.message.includes("Unexpected token") || e.message.includes("is not valid JSON")) {
                      throw new Error(`AI request failed with status ${response.status} (invalid JSON response)`);
                    }
                    throw e;
                  }
                }
                const text = await response.text();
                if (attempt < maxRetries && response.status >= 500) continue;
                throw new Error(`AI request failed (Status ${response.status}): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
              }

              const contentType = response.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                if (attempt < maxRetries) continue;
                throw new Error(`Expected JSON response but received ${contentType || 'text/plain'} (Status ${response.status}): ${text.substring(0, 100)}...`);
              }

              const data = await response.json();
              const text = data.text || (data.candidates?.[0]?.content?.parts?.[0]?.text) || "";
              return { 
                text: text,
                response: { text: () => text },
                candidates: data.candidates || [{ content: { parts: [{ text: text }] } }]
              };
            } catch (error: any) {
              clearTimeout(timeoutId);
              if (error.name === 'AbortError') {
                if (attempt < maxRetries) continue;
                throw new Error("AI request timed out after 95 seconds.");
              }
              if (attempt < maxRetries) continue;
              throw error;
            }
          } catch (error: any) {
            lastError = error;
            if (attempt === maxRetries) throw error;
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
        throw lastError;
      }
    },
    chats: {
      create: (params: any) => {
        return {
          sendMessage: async (msgParams: any) => {
            const history = msgParams.history || [];
            const contents = history.map((m: any) => ({
              role: m.role,
              parts: [{ text: m.text }]
            }));
            contents.push({
              role: 'user',
              parts: [{ text: msgParams.message }]
            });

            const result = await (getAI(profile, purpose) as any).models.generateContent({
              model: params.model,
              contents: contents,
              config: params.config
            });
            return result;
          }
        };
      }
    }
  };
};

export const checkAICache = (profile: UserProfile | null, prompt: string): string | null => {
  if (!profile?.aiCache) return null;
  const normalizedPrompt = prompt.trim().toLowerCase();
  return profile.aiCache[normalizedPrompt] || null;
};

export const updateAICache = async (profile: UserProfile | null, user: any, prompt: string, response: string, isDemo: boolean, setProfile: any) => {
  if (!profile) return;
  const normalizedPrompt = prompt.trim().toLowerCase();
  const newCache = { ...(profile.aiCache || {}), [normalizedPrompt]: response };
  
  if (isDemo) {
    const updatedProfile = { ...profile, aiCache: newCache };
    safeStorage.setItem('komorebi_profile', JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
  } else if (user) {
    try {
      await updateDoc(doc(db, 'users', user.uid), { aiCache: newCache });
    } catch (e) {
      console.error("Error updating AI cache:", e);
    }
  }
};

export const rotateApiKey = (profile: UserProfile | null) => {
  if (profile?.apiKeys && profile.apiKeys.length > 1) {
    currentKeyIndex++;
    return true;
  }
  return false;
};

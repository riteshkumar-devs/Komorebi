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
  if (requestedModel) return requestedModel;
  if (!provider) return 'gemini-2.0-flash';
  
  const models = AI_MODELS[provider.toLowerCase()];
  if (!models || models.length === 0) {
    if (provider.toLowerCase() === 'openrouter') return 'mistralai/mistral-7b-instruct';
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
        
        if (keyInfo.provider === 'gemini') {
          try {
            const genAI = new GoogleGenAI({ apiKey: keyInfo.key });
            const response = await (genAI as any).models.generateContent({
              model: targetModel,
              contents: params.contents,
              config: params.config
            });
            
            const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || "";
            return { 
              text: text, 
              response: { text: () => text },
              candidates: response.candidates || [{ content: { parts: [{ text: text }] } }]
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

        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
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

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            let errorMsg = errorData.error || errorData.details || "AI request failed";
            if (errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("credit")) {
              errorMsg = "API Provider: Quota exceeded or insufficient credits.";
            } else if (errorMsg.toLowerCase().includes("key") || errorMsg.toLowerCase().includes("unauthorized")) {
              errorMsg = "API Provider: Invalid API key.";
            }
            throw new Error(errorMsg);
          }
          throw new Error(`AI request failed with status ${response.status}`);
        }

        const data = await response.json();
        const text = data.text || (data.candidates?.[0]?.content?.parts?.[0]?.text) || "";
        return { 
          text: text,
          response: { text: () => text },
          candidates: data.candidates || [{ content: { parts: [{ text: text }] } }]
        };
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

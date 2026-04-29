import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { safeStorage } from '../lib/utils';
import { getAI } from '../lib/ai';

const useTTS = () => {
  const { profile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [hasJaVoice, setHasJaVoice] = useState<boolean | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [mode, setMode] = useState<'native' | 'gemini'>(() => {
    return (safeStorage.getItem('komorebi_tts_mode') as 'native' | 'gemini') || 'native';
  });

  // Pre-warm voices
  useEffect(() => {
    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang.toLowerCase().includes('ja') || v.lang.toLowerCase().includes('jp'));
      setHasJaVoice(!!jaVoice);
    };

    checkVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }
  }, []);

  const setTTSMode = (newMode: 'native' | 'gemini') => {
    setMode(newMode);
    localStorage.setItem('komorebi_tts_mode', newMode);
    if (newMode === 'gemini') setQuotaExhausted(false);
  };

  const playNative = (text: string) => {
    return new Promise<void>((resolve, reject) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang.toLowerCase().includes('ja')) || 
                      voices.find(v => v.lang.toLowerCase().includes('jp'));
      
      if (jaVoice) {
        utterance.voice = jaVoice;
      } else {
        console.warn("No Japanese voice found on this device. Using default.");
      }

      utterance.onstart = () => setLoading(true);
      utterance.onend = () => {
        setLoading(false);
        resolve();
      };
      utterance.onerror = (e) => {
        setLoading(false);
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const playGemini = async (text: string) => {
    try {
      const ai = getAI(profile);
      if (!ai) throw new Error("Gemini API Key is missing. Please add GEMINI_API_KEY to your secrets.");
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in Japanese: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        return new Promise<void>((resolve, reject) => {
          audio.onplay = () => setLoading(true);
          audio.onended = () => {
            setLoading(false);
            resolve();
          };
          audio.onerror = (e) => {
            setLoading(false);
            reject(e);
          };
          audio.play().catch(reject);
        });
      } else {
        throw new Error("No audio content received from Gemini TTS");
      }
    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota')) {
        setQuotaExhausted(true);
        setMode('native'); // Auto-switch to native
      }
      throw error;
    }
  };

  const play = async (text: string) => {
    if (loading || !text) return;
    
    try {
      if (mode === 'gemini' && !quotaExhausted) {
        await playGemini(text);
      } else {
        await playNative(text);
      }
    } catch (error) {
      if (mode !== 'native') {
        await playNative(text);
      }
    }
  };

  return { play, loading, mode, setTTSMode, hasJaVoice, quotaExhausted };
};

export const TTSContext = createContext<{
  play: (text: string) => Promise<void>;
  loading: boolean;
  mode: 'native' | 'gemini';
  setTTSMode: (mode: 'native' | 'gemini') => void;
  hasJaVoice: boolean | null;
  quotaExhausted: boolean;
}>({
  play: async () => {},
  loading: false,
  mode: 'native',
  setTTSMode: () => {},
  hasJaVoice: null,
  quotaExhausted: false,
});

export const TTSProvider = ({ children }: { children: React.ReactNode }) => {
  const tts = useTTS();
  return (
    <TTSContext.Provider value={tts}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTSContext = () => useContext(TTSContext);

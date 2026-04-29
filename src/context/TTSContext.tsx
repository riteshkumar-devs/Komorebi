import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { safeStorage } from '../lib/utils';

const useTTS = () => {
  const { profile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [hasJaVoice, setHasJaVoice] = useState<boolean | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [mode, setMode] = useState<'native'>(() => 'native');

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

  const setTTSMode = (newMode: 'native') => {
    setMode(newMode);
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

  const play = async (text: string) => {
    if (loading || !text) return;
    
    try {
      await playNative(text);
    } catch (error) {
      console.error("Native TTS Error:", error);
    }
  };

  return { play, loading, mode, setTTSMode, hasJaVoice, quotaExhausted };
};

export const TTSContext = createContext<{
  play: (text: string) => Promise<void>;
  loading: boolean;
  mode: 'native';
  setTTSMode: (mode: 'native') => void;
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

import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  Trash2, 
  PlayCircle, 
  XCircle,
  LogIn,
  LogOut,
  Globe,
  Instagram,
  Youtube,
  Github,
  Linkedin,
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { cn, applyThemeToElement, safeStorage } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { useTTSContext } from '../context/TTSContext';
import { getApiKey, getSafeModel, rotateApiKey, getAI } from '../lib/ai';
import { UserProfile, Vocabulary, OperationType } from '../types';
import { AI_MODELS } from '../lib/constants';
import { GoogleGenAI } from '@google/genai';
import { 
  updateDoc, 
  doc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut, deleteUser, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export const Settings = ({ vocab }: { vocab: Vocabulary[] }) => {
  const { profile, user, isDemo, setProfile, setDemoMode, setActiveTab } = useContext(AuthContext);
  const { mode, setTTSMode } = useTTSContext();
  const [name, setName] = useState(profile?.displayName || '');
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoal || 5);
  const [avatar, setAvatar] = useState(profile?.avatar || '🦊');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notificationsEnabled ?? true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(profile?.theme || 'system');
  const [saving, setSaving] = useState(false);
  
  // Help & Feedback State
  const [showHelp, setShowHelp] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackScreenshot, setFeedbackScreenshot] = useState<string | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  }, [profile?.theme]);

  useEffect(() => {
    applyThemeToElement(theme);
  }, [theme]);

  const hasApiKey = !!getApiKey(profile);

  const avatars = ['🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🦉'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateApiSettings = async (updates: Partial<UserProfile['apiSettings']>) => {
    try {
      const currentSettings = profile?.apiSettings || { mode: 'universal', universalKeys: profile?.apiKeys || [] };
      
      // Deep merge structuredKeys if it exists in updates
      let newStructuredKeys = currentSettings.structuredKeys;
      if (updates.structuredKeys) {
        newStructuredKeys = {
          ...(currentSettings.structuredKeys || {}),
          ...updates.structuredKeys
        };
      }

      const newSettings = { 
        ...currentSettings, 
        ...updates,
        structuredKeys: newStructuredKeys
      };
      
      if (isDemo) {
        const p = JSON.parse(localStorage.getItem('komorebi_profile') || '{}');
        const updatedProfile = { ...p, apiSettings: newSettings };
        localStorage.setItem('komorebi_profile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile as any);
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid), { apiSettings: newSettings });
      }
    } catch (error) {
      console.error("Error updating API settings:", error);
    }
  };

  const handleAddKey = (type: 'universal' | 'translation' | 'sensei' | 'dictionary') => {
    const currentSettings = profile?.apiSettings || { mode: 'universal', universalKeys: profile?.apiKeys || [] };
    const structuredKeys = currentSettings.structuredKeys || {};
    
    let keySet = [...(structuredKeys[type] || [])];
    
    if (keySet.length === 0) {
      const legacyField = type === 'universal' ? 'universalKeys' : 
                          type === 'translation' ? 'translationKeys' : 
                          type === 'sensei' ? 'senseiKeys' : 'dictionaryKeys';
      const legacyKeys = currentSettings[legacyField] || (type === 'universal' ? profile?.apiKeys : []) || [];
      keySet = legacyKeys.map(k => ({ key: k, provider: 'gemini' }));
    }

    const newStructuredKeys = {
      ...structuredKeys,
      [type]: [...keySet, { key: '', provider: 'gemini' }]
    };

    const legacyField = type === 'universal' ? 'universalKeys' : 
                        type === 'translation' ? 'translationKeys' : 
                        type === 'sensei' ? 'senseiKeys' : 'dictionaryKeys';
    const legacyKeys = [...keySet.map(k => k.key), ''];

    handleUpdateApiSettings({ 
      structuredKeys: newStructuredKeys,
      [legacyField]: legacyKeys
    });
  };

  const handleKeyChange = (type: 'universal' | 'translation' | 'sensei' | 'dictionary', idx: number, field: 'key' | 'provider' | 'baseUrl' | 'customProvider' | 'model', value: string) => {
    const currentSettings = profile?.apiSettings || { mode: 'universal', universalKeys: profile?.apiKeys || [] };
    const structuredKeys = currentSettings.structuredKeys || {};
    
    let keySet = [...(structuredKeys[type] || [])];
    
    // If structured keys are missing for this type, initialize from legacy
    if (keySet.length === 0) {
      const legacyField = type === 'universal' ? 'universalKeys' : 
                          type === 'translation' ? 'translationKeys' : 
                          type === 'sensei' ? 'senseiKeys' : 'dictionaryKeys';
      const legacyKeys = currentSettings[legacyField] || (type === 'universal' ? profile?.apiKeys : []) || [];
      keySet = legacyKeys.map(k => ({ key: k, provider: 'gemini' }));
    }
    
    // Ensure the index exists
    if (keySet.length === 0) {
      keySet = [{ key: '', provider: 'gemini' }];
    }
    
    if (!keySet[idx]) {
      keySet[idx] = { key: '', provider: 'gemini' };
    }
    
    if (field === 'provider') {
      // Reset model when provider changes
      const providersDict: any = AI_MODELS;
      const defaultModel = providersDict[value.toLowerCase()]?.[0]?.id || 'gemini-2.0-flash';
      keySet[idx] = { ...keySet[idx], provider: value as any, model: defaultModel };
    } else {
      (keySet[idx] as any)[field] = value;
    }

    const newStructuredKeys = {
      ...structuredKeys,
      [type]: keySet
    };

    // Sync legacy if it's the key field
    const legacyField = type === 'universal' ? 'universalKeys' : 
                        type === 'translation' ? 'translationKeys' : 
                        type === 'sensei' ? 'senseiKeys' : 'dictionaryKeys';
    const legacyKeys = keySet.map(k => k.key);

    handleUpdateApiSettings({ 
      structuredKeys: newStructuredKeys,
      [legacyField]: legacyKeys
    });
  };

  const handleRemoveKey = (type: 'universal' | 'translation' | 'sensei' | 'dictionary', idx: number) => {
    const currentSettings = profile?.apiSettings || { mode: 'universal', universalKeys: profile?.apiKeys || [] };
    const structuredKeys = currentSettings.structuredKeys || {};
    
    let keySet = [...(structuredKeys[type] || [])];
    
    if (keySet.length === 0) {
      const legacyField = type === 'universal' ? 'universalKeys' : 
                          type === 'translation' ? 'translationKeys' : 
                          type === 'sensei' ? 'senseiKeys' : 'dictionaryKeys';
      const legacyKeys = currentSettings[legacyField] || (type === 'universal' ? profile?.apiKeys : []) || [];
      keySet = legacyKeys.map(k => ({ key: k, provider: 'gemini' }));
    }

    const newKeySet = keySet.filter((_, i) => i !== idx);
    
    const newStructuredKeys = {
      ...structuredKeys,
      [type]: newKeySet
    };

    const legacyField = type === 'universal' ? 'universalKeys' : 
                        type === 'translation' ? 'translationKeys' : 
                        type === 'sensei' ? 'senseiKeys' : 'dictionaryKeys';
    const legacyKeys = newKeySet.map(k => k.key);

    handleUpdateApiSettings({ 
      structuredKeys: newStructuredKeys,
      [legacyField]: legacyKeys
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updates = { 
        displayName: name, 
        dailyGoal: Number(dailyGoal),
        avatar: avatar,
        notificationsEnabled: notificationsEnabled,
        theme: theme
      };
      if (isDemo) {
        const p = JSON.parse(safeStorage.getItem('komorebi_profile') || '{}');
        const updatedProfile = { ...p, ...updates };
        safeStorage.setItem('komorebi_profile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile as any);
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid), updates);
      }
      safeStorage.setItem('komorebi_theme', theme);
    } finally {
      setSaving(false);
    }
  };

  const FAQS = [
    {
      q: "What is Komorebi?",
      a: "Komorebi is an AI-powered Japanese language learning platform designed to make mastering Japanese intuitive and engaging, specifically for learners in India and worldwide."
    },
    {
      q: "How does the AI Sensei work?",
      a: "Sensei uses state-of-the-art Large Language Models (like Gemini 2.0) to provide context-aware explanations, example sentences, and conversational practice that feels like talking to a native tutor."
    },
    {
      q: "Is it really free?",
      a: "We offer a generous free tier that includes daily AI chat limits, dictionary searches, and vocabulary management. For unlimited access and advanced features, you can upgrade to Premium."
    },
    {
      q: "What is Solo Leveling Ranks?",
      a: "Inspired by the popular series, our ranking system tracks your progress from E-Rank to S-Rank and beyond, based on your vocabulary growth and consistency."
    },
    {
      q: "Can I use it offline?",
      a: "While AI features require an internet connection, your vocabulary list and notes are cached locally for quick review even when you're briefly offline."
    },
    {
      q: "How do I upgrade to Premium?",
      a: "Visit the Subscription tab to see our plans. You can pay via UPI (for Indian users), and once confirmed, your account will be upgraded instantly."
    }
  ];

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSavingFeedback(true);
    try {
      if (!isDemo && user) {
        await addDoc(collection(db, 'feedback'), {
          userId: user.uid,
          userEmail: user.email,
          rating: feedbackRating,
          message: feedbackText,
          screenshot: feedbackScreenshot, // Note: storing base64 in Firestore works for small images but ideally should be Storage
          createdAt: Timestamp.now()
        });
      }
      alert("Feedback sent successfully! Thank you for helping us improve.");
      setFeedbackText('');
      setFeedbackScreenshot(null);
      setFeedbackRating(5);
      setShowHelp(false);
    } catch (error) {
      console.error("Error sending feedback:", error);
      alert("Failed to send feedback. Please try again later.");
    } finally {
      setSavingFeedback(false);
    }
  };

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      if (isDemo) {
        safeStorage.removeItem('komorebi_demo');
        safeStorage.removeItem('komorebi_profile');
        safeStorage.removeItem('komorebi_vocab');
        safeStorage.removeItem('komorebi_notes');
        safeStorage.removeItem('discovered_words');
        safeStorage.removeItem('chatbot_history');
        setProfile(null);
        setDemoMode(false);
      } else if (user) {
        // 1. Delete vocabularies
        const vocabQuery = query(collection(db, 'users', user.uid, 'vocabularies'));
        const vocabSnap = await getDocs(vocabQuery);
        for (const d of vocabSnap.docs) {
          await deleteDoc(d.ref);
        }
        
        // 2. Delete notes
        const notesQuery = query(collection(db, 'users', user.uid, 'notes'));
        const notesSnap = await getDocs(notesQuery);
        for (const d of notesSnap.docs) {
          await deleteDoc(d.ref);
        }
        
        // 3. Delete profile
        await deleteDoc(doc(db, 'users', user.uid));
        
        // 4. Delete Auth User
        try {
          await deleteUser(user);
        } catch (authError: any) {
          console.error("Auth deletion error:", authError);
          if (authError.code === 'auth/requires-recent-login') {
            alert("For security reasons, you need to have recently logged in to delete your account. Please log out and log back in, then try again.");
            setSaving(false);
            return;
          }
        }
        
        // 5. Sign out
        await signOut(auth);
        setProfile(null);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectAccount = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setDemoMode(false);
    } catch (error) {
      console.error("Error connecting account:", error);
    }
  };

  const handleTestAI = async (specificKeyInfo?: { key: string, provider: string, baseUrl?: string, customProvider?: string }) => {
    setTestStatus('testing');
    setTestError(null);
    try {
      let keyInfo = specificKeyInfo;
      
      if (!keyInfo) {
        // Try to find any key to test, starting with universal, then sensei, etc.
        keyInfo = getApiKey(profile, 'general');
        if (!keyInfo) keyInfo = getApiKey(profile, 'sensei');
        if (!keyInfo) keyInfo = getApiKey(profile, 'translation');
        if (!keyInfo) keyInfo = getApiKey(profile, 'dictionary');
      }

      if (!keyInfo) {
        throw new Error("No API keys found. Please add a key in Settings.");
      }

      const providerName = (keyInfo as any).customProvider || keyInfo.provider.toUpperCase();

      let responseText = '';

      if (keyInfo.provider === 'gemini' || true) { // Use unified interface for all
        const targetModel = getSafeModel(keyInfo.provider);
        
        if (keyInfo.provider === 'gemini') {
          try {
            const ai = new GoogleGenAI({ apiKey: keyInfo.key });
            const response = await ai.models.generateContent({ 
              model: targetModel, 
              contents: "Respond with exactly the word 'OK'." 
            });
            responseText = response.text || "";
          } catch (error: any) {
            throw new Error(error.message || "Gemini Test Failed");
          }
        } else {
          // Fallback or specific proxy
          const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              provider: keyInfo.provider,
              key: keyInfo.key,
              baseUrl: keyInfo.baseUrl,
              model: targetModel,
              contents: "Respond with exactly the word 'OK'.",
              systemInstruction: "You are a helpful assistant testing a connection."
            })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || data.details || `Request failed with status ${response.status}`);
          }
          const data = await response.json();
          responseText = data.text || "";
        }
      }

      if (responseText && responseText.toUpperCase().includes('OK')) {
        setTestStatus('success');
        setTestError(null);
        alert(`AI Connection Success! (${providerName})\nResponse: ${responseText}`);
      } else {
        throw new Error(`AI responded but not with the expected format: "${responseText.substring(0, 50)}..."`);
      }
    } catch (err: any) {
      console.error('AI Test Error:', err);
      let errorMsg = 'Unknown error';
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'object') {
        try {
          errorMsg = JSON.stringify(err, null, 2);
        } catch (e) {
          errorMsg = String(err);
        }
      } else {
        errorMsg = String(err);
      }
      setTestStatus('error');
      setTestError(errorMsg);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-12 px-4 pt-4">
      <div className="space-y-10">
        {/* Profile Section */}
        <section className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] border-[6px] border-white dark:border-stone-800 shadow-2xl overflow-hidden bg-white dark:bg-stone-900 flex items-center justify-center transition-all group-hover:scale-[1.02]">
                {avatar.startsWith('data:image') ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl drop-shadow-lg">{avatar}</span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#f2a93b] text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-all flex items-center justify-center border-4 border-white dark:border-stone-800">
                <Camera className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{profile?.displayName || 'Adventurer'}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-[#f2a93b] text-[10px] font-bold rounded-full border border-amber-100 dark:border-amber-900/30 uppercase tracking-widest">{profile?.rank || 'E5'} Hunter</span>
                <span className="w-1 h-1 bg-stone-300 rounded-full" />
                <span className="text-stone-400 text-[10px] uppercase tracking-widest font-bold">{profile?.xp || 0} XP Total</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-8">
            <div className="space-y-6">
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                {avatars.map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={cn(
                      "aspect-square rounded-2xl flex items-center justify-center text-xl transition-all border-2 font-bold",
                      avatar === a 
                        ? "bg-[#f2a93b]/10 border-[#f2a93b] scale-110 shadow-lg shadow-[#f2a93b]/20" 
                        : "bg-stone-50 dark:bg-stone-800 border-transparent hover:border-stone-200 dark:hover:border-stone-700"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>

              <div className="space-y-6 pt-4 border-t border-stone-50 dark:border-stone-800">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Hunter Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-transparent focus:border-[#f2a93b] rounded-[1.5rem] px-6 py-4 outline-none transition-all font-bold text-stone-900 dark:text-stone-100"
                      placeholder="Enter your name..."
                    />
                    <Sparkles className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Daily Target</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(Number(e.target.value))}
                        className="w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-transparent focus:border-[#f2a93b] rounded-[1.5rem] px-6 py-4 outline-none transition-all font-bold text-stone-900 dark:text-stone-100"
                      />
                      <BookOpen className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Theme</label>
                    <div className="bg-stone-50 dark:bg-stone-800/50 p-1 rounded-[1.5rem] flex h-[58px]">
                       {[
                         { id: 'light', icon: Sun },
                         { id: 'system', icon: Monitor },
                         { id: 'dark', icon: Moon }
                       ].map((t) => (
                         <button
                           key={t.id}
                           onClick={() => setTheme(t.id as any)}
                           className={cn(
                             "flex-1 rounded-xl flex items-center justify-center transition-all font-bold",
                             theme === t.id ? "bg-white dark:bg-stone-700 shadow-md text-stone-900 dark:text-[#f2a93b]" : "text-stone-400"
                           )}
                         >
                           <t.icon className="w-4 h-4" />
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Notifications</label>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={cn(
                      "w-full h-[58px] rounded-[1.5rem] flex items-center justify-between px-6 transition-all border-2",
                      notificationsEnabled 
                        ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-[#f2a93b]" 
                        : "bg-stone-50 dark:bg-stone-800/50 border-transparent text-stone-400"
                    )}
                  >
                     <div className="flex items-center gap-3">
                        <Bell className={cn("w-5 h-5", notificationsEnabled ? "animate-bounce" : "")} />
                        <span className="text-xs font-bold uppercase tracking-widest">{notificationsEnabled ? "Enabled" : "Disabled"}</span>
                     </div>
                     <div className={cn(
                       "w-10 h-5 rounded-full relative transition-colors",
                       notificationsEnabled ? "bg-[#f2a93b]" : "bg-stone-300 dark:bg-stone-700"
                     )}>
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          notificationsEnabled ? "left-6" : "left-1"
                        )} />
                     </div>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-5 rounded-[1.5rem] font-bold uppercase tracking-[0.3em] text-xs shadow-2xl hover:translate-y-[-2px] transition-all active:translate-y-[0px] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
              Update Hunter Profile
            </button>
          </div>
        </section>

        <div className="h-px bg-stone-50 dark:bg-stone-800" />

        {/* Help & Social Section */}
        <section className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Connect & Support</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Help Button Card */}
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="p-8 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl flex flex-col items-center justify-center gap-4 hover:border-[#f2a93b] transition-all group"
            >
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-editorial italic text-stone-900 dark:text-stone-100">{showHelp ? 'Close Help' : 'Help Center'}</h4>
                <p className="text-[10px] text-stone-400 font-serif italic uppercase tracking-widest">FAQs & Live Feedback</p>
              </div>
            </button>

            {/* Social Links Card */}
            <div className="p-8 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-xl space-y-6">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Follow the Creator</h4>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { icon: Instagram, label: 'Insta', url: 'https://www.instagram.com/ai.ritesh_2705?igsh=aDB4YjBmYW50OGZo', color: 'text-pink-500' },
                  { icon: Youtube, label: 'YouTube', url: '#', color: 'text-red-500' },
                  { icon: Github, label: 'GitHub', url: 'https://github.com/riteshkumar477823-wq', color: 'text-stone-900 dark:text-white' },
                  { icon: Linkedin, label: 'LinkedIn', url: 'https://www.linkedin.com/in/ritesh-kumar-135bb237b?utm_source=share_via&utm_content=profile&utm_medium=member_android', color: 'text-blue-600' },
                  { icon: ExternalLink, label: 'Web', url: 'https://riteshshowcase.pages.dev/', color: 'text-stone-400' }
                ].map((social, i) => (
                  <a 
                    key={i} 
                    href={social.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-center border border-stone-100 dark:border-stone-700 hover:border-[#f2a93b] transition-all shadow-sm group"
                    title={social.label}
                  >
                    <social.icon className={cn("w-5 h-5", social.color)} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showHelp && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-8 overflow-hidden"
              >
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">Common Questions</h5>
                    <p className="text-[11px] text-stone-500 font-serif italic px-2">Answers to frequently asked journey questions 🌲</p>
                  </div>
                  
                  {/* FAQs Section */}
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {FAQS.map((faq, i) => (
                        <div key={i} className="space-y-2">
                          <button 
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full flex items-center justify-between gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl text-left hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          >
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{faq.q}</span>
                            <ChevronRight className={cn("w-4 h-4 text-stone-400 transition-transform", openFaq === i ? "rotate-90" : "")} />
                          </button>
                          {openFaq === i && (
                            <div className="px-4 pb-2">
                              <p className="text-xs text-stone-500 dark:text-stone-400 font-serif leading-relaxed italic">{faq.a}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-stone-50 dark:bg-stone-800" />

                  {/* Feedback Section */}
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Member Feedback</h5>
                      <p className="text-[11px] text-stone-500 font-serif italic">Help us grow our forest 🌲</p>
                    </div>

                    <div className="space-y-6">
                      {/* Rating */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">How was your journey?</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setFeedbackRating(star)}
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                feedbackRating >= star ? "bg-amber-50 dark:bg-amber-900/20 text-[#f2a93b]" : "bg-stone-50 dark:bg-stone-800 text-stone-300"
                              )}
                            >
                              <Sparkles className={cn("w-5 h-5", feedbackRating >= star ? "fill-current" : "")} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Screenshot Upload */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Upload Screenshot (Optional)</label>
                        <label className="w-full h-24 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-all overflow-hidden relative group">
                          {feedbackScreenshot ? (
                            <div className="w-full h-full p-2">
                              <img src={feedbackScreenshot} alt="Upload" className="w-full h-full object-cover rounded-lg" />
                              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            <>
                              <Camera className="w-6 h-6 text-stone-300" />
                              <span className="text-[9px] font-bold text-stone-400 uppercase">Click to upload</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setFeedbackScreenshot(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                      </div>

                      {/* Feedback Textarea */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Your Message</label>
                          <span className={cn(
                            "text-[8px] font-bold uppercase",
                            feedbackText.trim().split(/\s+/).length > 250 ? "text-red-500" : "text-stone-400"
                          )}>
                            {feedbackText.trim().split(/\s+/).filter(Boolean).length} / 250 Words
                          </span>
                        </div>
                        <textarea
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-transparent focus:border-[#f2a93b] rounded-2xl p-4 text-xs font-serif italic outline-none min-h-[120px] transition-all"
                          placeholder="Tell us what's on your mind... (Max 250 words)"
                        />
                      </div>

                      <button
                        onClick={handleSubmitFeedback}
                        disabled={savingFeedback || !feedbackText.trim() || feedbackText.trim().split(/\s+/).filter(Boolean).length > 250}
                        className="w-full py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {savingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Feedback</span>}
                      </button>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="h-px bg-stone-50 dark:bg-stone-800" />

        <section className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">AI & API Settings</h3>
          <div className="p-4 md:p-6 bg-stone-50 dark:bg-stone-800/50 rounded-[2rem] border border-stone-100 dark:border-stone-800 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">AI Usage Information</h4>
              </div>
              <p className="text-[10px] md:text-xs text-stone-500 dark:text-stone-400 font-serif italic">
                This project uses Gemini AI for: Dictionary lookups, sentence/paragraph translation, Image translation (Google Lens-style), and the Sensei Chat Bot.
              </p>
            </div>

            <div className="flex gap-2 md:gap-4 p-1 bg-stone-100 dark:bg-stone-900 rounded-2xl">
              <button 
                onClick={() => handleUpdateApiSettings({ mode: 'universal' })}
                className={cn(
                  "flex-1 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all",
                  (profile?.apiSettings?.mode || 'universal') === 'universal' ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-400"
                )}
              >
                Universal API
              </button>
              <button 
                onClick={() => handleUpdateApiSettings({ mode: 'particular' })}
                className={cn(
                  "flex-1 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all",
                  profile?.apiSettings?.mode === 'particular' ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-400"
                )}
              >
                Particular API
              </button>
            </div>

            {/* Universal Keys */}
            {((profile?.apiSettings?.mode || 'universal') === 'universal') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Universal Keys</div>
                  <button 
                    onClick={() => handleAddKey('universal')}
                    className="text-[10px] font-bold text-stone-900 dark:text-stone-100 hover:underline uppercase tracking-widest"
                  >
                    + Add Key
                  </button>
                </div>
                <div className="space-y-4">
                  {(profile?.apiSettings?.structuredKeys?.universal || (profile?.apiSettings?.universalKeys || profile?.apiKeys || ['']).map(k => ({ key: k, provider: 'gemini' }))).map((keyObj: any, idx: number) => (
                    <div key={idx} className="space-y-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Provider</label>
                          <select 
                            value={keyObj.provider}
                            onChange={(e) => handleKeyChange('universal', idx, 'provider', e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-stone-100 dark:border-stone-800 outline-none"
                          >
                            <option value="gemini">Gemini</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="xai">xAI (Grok)</option>
                          </select>
                        </div>
                        {AI_MODELS[keyObj.provider?.toLowerCase()] && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Model</label>
                            <select 
                              value={keyObj.model || AI_MODELS[keyObj.provider.toLowerCase()][0].id}
                              onChange={(e) => handleKeyChange('universal', idx, 'model', e.target.value)}
                              className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-stone-100 dark:border-stone-800 outline-none"
                            >
                              {AI_MODELS[keyObj.provider.toLowerCase()].map((m: any) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">API Key</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="password"
                            value={keyObj.key}
                            onChange={(e) => handleKeyChange('universal', idx, 'key', e.target.value)}
                            className="flex-1 p-2.5 bg-white dark:bg-stone-900 rounded-xl text-xs font-mono border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                            placeholder="Enter API Key here..."
                          />
                          <button 
                            onClick={() => handleTestAI({ key: keyObj.key, provider: keyObj.provider, baseUrl: keyObj.baseUrl, customProvider: keyObj.customProvider })}
                            className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-stone-600 shrink-0"
                            title="Test this key"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemoveKey('universal', idx)} 
                            className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-red-400 hover:text-red-600 shrink-0"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {keyObj.provider !== 'gemini' && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Base URL (Optional)</label>
                          <input 
                            type="text"
                            value={keyObj.baseUrl || ''}
                            onChange={(e) => handleKeyChange('universal', idx, 'baseUrl', e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-mono border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                            placeholder="https://api.example.com/v1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Particular Keys */}
            {profile?.apiSettings?.mode === 'particular' && (
              <div className="space-y-8">
                {/* Translation Keys */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Translation & Image Keys</div>
                    <button onClick={() => handleAddKey('translation')} className="text-[10px] font-bold text-stone-900 dark:text-stone-100 hover:underline uppercase tracking-widest">+ Add Key</button>
                  </div>
                  <div className="space-y-4">
                    {(profile?.apiSettings?.structuredKeys?.translation || (profile?.apiSettings?.translationKeys || ['']).map(k => ({ key: k, provider: 'gemini' }))).map((keyObj: any, idx: number) => (
                      <div key={idx} className="space-y-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Provider</label>
                            <select 
                               value={keyObj.provider}
                               onChange={(e) => handleKeyChange('translation', idx, 'provider', e.target.value)}
                               className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-stone-100 dark:border-stone-800 outline-none"
                             >
                               <option value="gemini">Gemini</option>
                               <option value="openai">OpenAI</option>
                               <option value="anthropic">Anthropic</option>
                               <option value="openrouter">OpenRouter</option>
                               <option value="xai">xAI (Grok)</option>
                             </select>
                           </div>
                           {AI_MODELS[keyObj.provider?.toLowerCase()] && (
                             <div className="space-y-1">
                               <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Model</label>
                               <select 
                                 value={keyObj.model || AI_MODELS[keyObj.provider.toLowerCase()][0].id}
                                 onChange={(e) => handleKeyChange('translation', idx, 'model', e.target.value)}
                                 className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-stone-100 dark:border-stone-800 outline-none"
                               >
                                 {AI_MODELS[keyObj.provider.toLowerCase()].map((m: any) => (
                                   <option key={m.id} value={m.id}>{m.name}</option>
                                 ))}
                               </select>
                             </div>
                           )}
                         </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">API Key</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="password"
                              value={keyObj.key}
                              onChange={(e) => handleKeyChange('translation', idx, 'key', e.target.value)}
                              className="flex-1 p-2.5 bg-white dark:bg-stone-900 rounded-xl text-xs font-mono border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                              placeholder="Enter API Key here..."
                            />
                            <button 
                              onClick={() => handleTestAI({ key: keyObj.key, provider: keyObj.provider, baseUrl: keyObj.baseUrl, customProvider: keyObj.customProvider })}
                              className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-stone-600 shrink-0"
                              title="Test this key"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemoveKey('translation', idx)} className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-red-400 hover:text-red-600 shrink-0"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sensei Keys */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Sensei Chat Bot Keys</div>
                    <button onClick={() => handleAddKey('sensei')} className="text-[10px] font-bold text-stone-900 dark:text-stone-100 hover:underline uppercase tracking-widest">+ Add Key</button>
                  </div>
                  <div className="space-y-4">
                    {(profile?.apiSettings?.structuredKeys?.sensei || (profile?.apiSettings?.senseiKeys || ['']).map(k => ({ key: k, provider: 'gemini' }))).map((keyObj: any, idx: number) => (
                      <div key={idx} className="space-y-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Provider</label>
                            <select 
                               value={keyObj.provider}
                               onChange={(e) => handleKeyChange('sensei', idx, 'provider', e.target.value)}
                               className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-stone-100 dark:border-stone-800 outline-none"
                             >
                               <option value="gemini">Gemini</option>
                               <option value="openai">OpenAI</option>
                               <option value="anthropic">Anthropic</option>
                               <option value="openrouter">OpenRouter</option>
                               <option value="xai">xAI (Grok)</option>
                             </select>
                           </div>
                           {AI_MODELS[keyObj.provider?.toLowerCase()] && (
                             <div className="space-y-1">
                               <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Model</label>
                               <select 
                                 value={keyObj.model || AI_MODELS[keyObj.provider.toLowerCase()][0].id}
                                 onChange={(e) => handleKeyChange('sensei', idx, 'model', e.target.value)}
                                 className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-stone-100 dark:border-stone-800 outline-none"
                               >
                                 {AI_MODELS[keyObj.provider.toLowerCase()].map((m: any) => (
                                   <option key={m.id} value={m.id}>{m.name}</option>
                                 ))}
                               </select>
                             </div>
                           )}
                         </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">API Key</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="password"
                              value={keyObj.key}
                              onChange={(e) => handleKeyChange('sensei', idx, 'key', e.target.value)}
                              className="flex-1 p-2.5 bg-white dark:bg-stone-900 rounded-xl text-xs font-mono border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                              placeholder="Enter API Key here..."
                            />
                            <button 
                              onClick={() => handleTestAI({ key: keyObj.key, provider: keyObj.provider, baseUrl: keyObj.baseUrl, customProvider: keyObj.customProvider })}
                              className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-stone-600 shrink-0"
                              title="Test this key"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemoveKey('sensei', idx)} className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-red-400 hover:text-red-600 shrink-0"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dictionary Keys */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Dictionary Keys</div>
                    <button onClick={() => handleAddKey('dictionary')} className="text-[10px] font-bold text-stone-900 dark:text-stone-100 hover:underline uppercase tracking-widest">+ Add Key</button>
                  </div>
                  <div className="space-y-4">
                    {(profile?.apiSettings?.structuredKeys?.dictionary || (profile?.apiSettings?.dictionaryKeys || ['']).map(k => ({ key: k, provider: 'gemini' }))).map((keyObj: any, idx: number) => (
                      <div key={idx} className="space-y-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Provider</label>
                            <select 
                               value={keyObj.provider}
                               onChange={(e) => handleKeyChange('dictionary', idx, 'provider', e.target.value)}
                               className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-stone-100 dark:border-stone-800 outline-none"
                             >
                               <option value="gemini">Gemini</option>
                               <option value="openai">OpenAI</option>
                               <option value="anthropic">Anthropic</option>
                               <option value="openrouter">OpenRouter</option>
                               <option value="xai">xAI (Grok)</option>
                             </select>
                           </div>
                           {AI_MODELS[keyObj.provider?.toLowerCase()] && (
                             <div className="space-y-1">
                               <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">Model</label>
                               <select 
                                 value={keyObj.model || AI_MODELS[keyObj.provider.toLowerCase()][0].id}
                                 onChange={(e) => handleKeyChange('dictionary', idx, 'model', e.target.value)}
                                 className="w-full p-2.5 bg-white dark:bg-stone-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-stone-100 dark:border-stone-800 outline-none"
                               >
                                 {AI_MODELS[keyObj.provider.toLowerCase()].map((m: any) => (
                                   <option key={m.id} value={m.id}>{m.name}</option>
                                 ))}
                               </select>
                             </div>
                           )}
                         </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">API Key</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="password"
                              value={keyObj.key}
                              onChange={(e) => handleKeyChange('dictionary', idx, 'key', e.target.value)}
                              className="flex-1 p-2.5 bg-white dark:bg-stone-900 rounded-xl text-xs font-mono border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                              placeholder="Enter API Key here..."
                            />
                            <button 
                              onClick={() => handleTestAI({ key: keyObj.key, provider: keyObj.provider, baseUrl: keyObj.baseUrl, customProvider: keyObj.customProvider })}
                              className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-stone-600 shrink-0"
                              title="Test this key"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemoveKey('dictionary', idx)} className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-red-400 hover:text-red-600 shrink-0"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleTestAI()}
                disabled={testStatus === 'testing'}
                className={cn(
                  "flex-1 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  testStatus === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800" :
                  testStatus === 'error' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800" :
                  "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200"
                )}
              >
                {testStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {testStatus === 'testing' ? "Testing Connection..." : 
                 testStatus === 'success' ? "Connection Successful" : 
                 testStatus === 'error' ? "Connection Failed" : "Test AI Connection"}
              </button>

              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear all API keys? This cannot be undone.")) {
                    handleUpdateApiSettings({
                      structuredKeys: {
                        universal: [{ key: '', provider: 'gemini' }],
                        sensei: [{ key: '', provider: 'gemini' }],
                        translation: [{ key: '', provider: 'gemini' }],
                        dictionary: [{ key: '', provider: 'gemini' }]
                      }
                    });
                  }
                }}
                className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-800 transition-all border border-red-100 dark:border-red-800 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Keys
              </button>
            </div>
            {testError && <p className="text-[10px] text-red-500 text-center font-mono">{testError}</p>}
          </div>
        </section>

        <div className="h-px bg-stone-50 dark:bg-stone-800" />

        <section className="space-y-4 pt-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Session</h3>
          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 space-y-4">
             <button 
                onClick={() => signOut(auth)}
                className="w-full py-4 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-2xl font-bold text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
          </div>
        </section>

        <section className="space-y-4 pt-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-400">Danger Zone</h3>
          <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-6">
            {isDemo ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-red-900">Guest Mode</div>
                  <div className="text-xs text-red-600 font-serif italic">Your data is stored locally and will be lost if you clear your browser cache.</div>
                </div>
                <button 
                  onClick={handleConnectAccount}
                  className="w-full py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Connect to an Account
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-red-900">Delete Account</div>
                  <div className="text-xs text-red-600 font-serif italic">This will permanently delete your profile, vocabulary, and notes. This action cannot be undone.</div>
                </div>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            )}

            {showDeleteConfirm && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-white rounded-2xl border-2 border-red-100 shadow-xl space-y-4"
              >
                <div className="text-sm font-bold text-stone-900">Are you absolutely sure?</div>
                <p className="text-xs text-stone-500 font-serif italic">This will erase all your progress and data permanently.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleDeleteAccount}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all"
                  >
                    Yes, Delete
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-xs hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

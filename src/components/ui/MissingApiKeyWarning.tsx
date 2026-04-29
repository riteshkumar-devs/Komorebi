import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Sparkles, Trees } from 'lucide-react';

export const MissingApiKeyWarning = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-8 rounded-[2.5rem] text-center space-y-4 shadow-xl shadow-amber-900/5"
  >
    <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
      <AlertCircle className="w-8 h-8 text-amber-500 animate-pulse" />
    </div>
    <h3 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100">AI API Key Required</h3>
    <p className="text-stone-600 dark:text-stone-400 font-serif italic text-sm max-w-md mx-auto">
      To use the AI features like Sensei Chat, Translator, and Dictionary, you need to add an AI API Key (Gemini, OpenAI, OpenRouter, etc.) in the settings.
    </p>
    <div className="bg-white dark:bg-stone-800 p-6 rounded-2xl text-left text-xs space-y-3 border border-amber-50 dark:border-stone-700 shadow-sm transition-colors">
      <p className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest">How to fix:</p>
      <ol className="list-decimal list-inside space-y-2 text-stone-500 dark:text-stone-400">
        <li>Get an API key from your preferred provider (e.g., Google Cloud, OpenAI, or Anthropic)</li>
        <li>Open <b>Settings</b> (⚙️ gear icon, top-right) in this app</li>
        <li>Go to <b>AI Settings</b> section</li>
        <li>Add your key, select the provider, and save</li>
      </ol>
    </div>
  </motion.div>
);

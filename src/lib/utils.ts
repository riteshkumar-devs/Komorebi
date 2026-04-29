import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Utility for tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility for safe date formatting from Firestore Timestamp or plain object
export const getSafeDate = (date: any): Date => {
  if (!date) return new Date();
  if (typeof date.toDate === 'function') return date.toDate();
  if (date.seconds !== undefined) return new Date(date.seconds * 1000);
  if (date instanceof Date) return date;
  return new Date();
};

export const formatSafeDate = (date: any, formatStr: string = 'MMM d, yyyy') => {
  return format(getSafeDate(date), formatStr);
};

// --- Storage Helper for Chrome Compatibility ---
export const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied. Using memory fallback.");
      return (window as any)._memoryStorage?.[key] || null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      if (!(window as any)._memoryStorage) (window as any)._memoryStorage = {};
      (window as any)._memoryStorage[key] = value;
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      if ((window as any)._memoryStorage) delete (window as any)._memoryStorage[key];
    }
  }
};

export const generateCustomId = () => {
  return Math.floor(100000 + Math.random() * 900000000).toString();
};

import { auth } from '../firebase';
import { OperationType, FirestoreErrorInfo, UserProfile } from '../types';
import { SOLO_LEVELING_RANKS } from './constants';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || '',
      email: auth.currentUser?.email || '',
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName || '',
        email: provider.email || '',
        photoUrl: provider.photoURL || ''
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getNextRank = (currentRank: string) => {
  const index = SOLO_LEVELING_RANKS.indexOf(currentRank || 'E5');
  if (index === -1) return SOLO_LEVELING_RANKS[0];
  if (index === SOLO_LEVELING_RANKS.length - 1) return currentRank;
  return SOLO_LEVELING_RANKS[index + 1];
};

export const calculateRank = (wordCount: number) => {
  const titles = [
    "Novice Learner", "Aspiring Student", "Dedicated Pupil", "Language Seeker", "Word Collector",
    "Sentence Builder", "Grammar Explorer", "Kanji Apprentice", "Fluent Dreamer", "Cultural Bridge",
    "Linguistic Warrior", "Scholar of the East", "Master of Meanings", "Kanji Slayer", "Zen Master",
    "The Awakened", "Sovereign of Speech", "Legendary Linguist", "God of Gakushuu"
  ];

  const rankIndex = Math.min(Math.floor(wordCount / 50), SOLO_LEVELING_RANKS.length - 1);
  const titleIndex = Math.min(Math.floor(wordCount / 100), titles.length - 1);
  
  return {
    rank: SOLO_LEVELING_RANKS[rankIndex],
    title: titles[titleIndex]
  };
};

export const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

export const checkAchievements = (profile: UserProfile, vocabCount: number, notesCount: number, senseiChatCount: number) => {
  const newAchievements: string[] = [...(profile.achievements || [])];
  let changed = false;

  const addAchievement = (id: string) => {
    if (!newAchievements.includes(id)) {
      newAchievements.push(id);
      changed = true;
    }
  };

  if (vocabCount >= 1) addAchievement('first_word');
  if (profile.streakCount >= 3) addAchievement('streak_3');
  if (profile.streakCount >= 7) addAchievement('streak_7');
  if (profile.streakCount >= 30) addAchievement('streak_30');
  if (vocabCount >= 50) addAchievement('vocab_50');
  if (vocabCount >= 100) addAchievement('vocab_100');
  if (vocabCount >= 500) addAchievement('vocab_500');
  if (senseiChatCount >= 10) addAchievement('chat_10');

  // Rank achievements
  const rankIndex = SOLO_LEVELING_RANKS.indexOf(profile.rank || 'E5');
  if (rankIndex >= SOLO_LEVELING_RANKS.indexOf('D5')) addAchievement('rank_d');
  if (rankIndex >= SOLO_LEVELING_RANKS.indexOf('C5')) addAchievement('rank_c');
  if (rankIndex >= SOLO_LEVELING_RANKS.indexOf('B5')) addAchievement('rank_b');
  if (rankIndex >= SOLO_LEVELING_RANKS.indexOf('A5')) addAchievement('rank_a');
  if (rankIndex >= SOLO_LEVELING_RANKS.indexOf('S5')) addAchievement('rank_s');

  return changed ? newAchievements : null;
};

export const applyThemeToElement = (theme: 'light' | 'dark' | 'system') => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
};

import { Timestamp } from 'firebase/firestore';

export interface APIKey {
  key: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'xai';
  baseUrl?: string;
  customProvider?: string;
  model?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  streakCount: number;
  lastActiveDate: Timestamp | null;
  dailyGoalMet: boolean;
  xp: number;
  coins?: number;
  rank: string; // E5, E4, ..., SSS1
  title?: string; // e.g., "Novice Learner", "Kanji Slayer"
  dailyGoal?: number;
  avatar?: string;
  ownedAvatars?: string[];
  preferredTTS?: 'native' | 'gemini';
  notificationsEnabled?: boolean;
  soundEffectsEnabled?: boolean;
  achievements?: string[]; // IDs of unlocked achievements
  pinnedAchievements?: string[]; // IDs of pinned achievements (max 10)
  apiKeys?: string[]; // Multiple Gemini API keys (legacy)
  apiSettings?: {
    mode: 'universal' | 'particular';
    universalKeys?: string[];
    translationKeys?: string[];
    senseiKeys?: string[];
    dictionaryKeys?: string[];
    // New structured keys
    structuredKeys?: {
      universal?: APIKey[];
      translation?: APIKey[];
      sensei?: APIKey[];
      dictionary?: APIKey[];
    };
  };
  aiCache?: { [key: string]: string };
  quoteCache?: { text: string; translation: string }[];
  quoteStats?: { lastDate: string; count: number };
  theme?: 'light' | 'dark' | 'system';
  dictionarySearchesToday?: number;
  gameTimeToday?: number; // in seconds
  claimedRewards?: string[];
  customPhrases?: { jp: string; ro: string; en: string; category: string }[];
  onboardingCompleted?: boolean;
  dob?: string;
  careerGoal?: string;
  isPremium?: boolean;
  subscriptionPlan?: string;
  premiumExpiry?: Timestamp | null;
  role?: 'admin' | 'user' | 'client';
  customId?: string; // 6-9 digit unique ID
  joinedAt?: Timestamp;
  lastActive?: Timestamp;
  usageLimits?: {
    dictionaryCount?: number;
    translationCount?: number;
    chatCount?: number;
    lastResetDate?: string;
  };
}

export interface Note {
  id?: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  color?: string;
  isPinned?: boolean;
}

export interface Vocabulary {
  id?: string;
  uid: string;
  japanese: string;
  meaning: string;
  romaji?: string;
  createdAt: Timestamp;
  mastery: number;
  parentId?: string;
  type?: 'main' | 'sub';
  details?: string;
}

export interface DiscoveredWord {
  id?: string;
  jp: string;
  ro: string;
  en: string;
  createdAt?: Timestamp;
}

export interface Quote {
  id?: string;
  text: string;
  translation: string;
  author?: string;
  createdAt: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

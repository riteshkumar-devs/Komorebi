import React, { createContext } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Vocabulary, DiscoveredWord } from '../types';

export const AuthContext = createContext<{
  user: User | null;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  setDemoMode: (val: boolean) => void;
  isDemo: boolean;
  vocab: Vocabulary[];
  discoveredWords: DiscoveredWord[];
  setDiscoveredWords: (words: DiscoveredWord[]) => void;
  setActiveTab: (tab: any) => void;
  checkUsageLimit: (type: 'dictionary' | 'translation' | 'chat') => boolean;
  incrementUsage: (type: 'dictionary' | 'translation' | 'chat') => Promise<void>;
}>( {
  user: null,
  profile: null,
  setProfile: () => {},
  loading: true,
  signIn: async () => {},
  logout: async () => {},
  setDemoMode: () => {},
  isDemo: false,
  vocab: [],
  discoveredWords: [],
  setDiscoveredWords: () => {},
  setActiveTab: () => {},
  checkUsageLimit: () => false,
  incrementUsage: async () => {},
});

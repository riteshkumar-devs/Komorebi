import { useState, useEffect, useContext } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { getAI } from '../lib/ai';
import { UserProfile } from '../types';

export const useQuoteAgent = () => {
  const { profile } = useContext(AuthContext);
  const [quotes, setQuotes] = useState<any[]>([]);

  const fetchGlobalQuotes = async () => {
    try {
      const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuotes(fetched);

      // If less than 5 quotes, trigger agent to generate 10
      if (fetched.length < 5 && profile) {
        generateQuotes(profile);
      }
    } catch (e) {
      // ignore
    }
  };

  const generateQuotes = async (p: UserProfile) => {
    const ai = getAI(p, 'general');
    if (!ai) return;

    try {
      const prompt = `Generate 10 motivational or philosophical quotes about learning, wisdom, and the path to mastery, specifically relevant to a Japanese aesthetic (like Zen or 武士道). 
      Format as a JSON array: [{"text": "...", "translation": "...", "author": "..."}]`;
      
      const result = await ai.models.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(result.text);
      if (Array.isArray(parsed)) {
        for (const q of parsed.slice(0, 10)) {
          await addDoc(collection(db, 'quotes'), {
            ...q,
            createdAt: Timestamp.now()
          });
        }
        fetchGlobalQuotes(); // Refresh after upload
      }
    } catch (e) {
      console.error("Agent: Generation failure", e);
    }
  };

  useEffect(() => {
    fetchGlobalQuotes();
  }, [profile?.uid]);

  return { quotes };
};

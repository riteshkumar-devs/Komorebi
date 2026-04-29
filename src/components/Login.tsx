import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../context/AuthContext';

export const Login = () => {
  const { setDemoMode, signIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setDemoMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed] dark:bg-stone-950 p-6 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
          <div className="text-center mb-8">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-stone-900 dark:bg-[#f2a93b] rounded-3xl rotate-3 shadow-lg">
              <span className="text-4xl text-white dark:text-stone-900 font-bold">木</span>
            </div>
            <h1 className="text-5xl font-editorial italic tracking-tight text-stone-900 dark:text-stone-100 mb-2">Komorebi</h1>
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#f2a93b] mt-2 italic">Japanese Language Platform</span>
            <p className="text-stone-600 dark:text-stone-400 font-serif italic text-lg mt-4">
              "Sunlight filtering through the leaves." <br/>
              Your daily companion for mastering Japanese.
            </p>
          </div>

        <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-6 transition-colors">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 outline-none transition-all text-stone-900 dark:text-stone-100"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700 outline-none transition-all text-stone-900 dark:text-stone-100"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-xs text-red-500 ml-2 italic">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-stone-900 dark:bg-[#f2a93b] text-white dark:text-stone-900 rounded-full font-extrabold hover:bg-stone-800 dark:hover:bg-amber-500 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100 dark:border-stone-800"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-stone-400"><span className="bg-white dark:bg-stone-900 px-2 transition-colors">Or continue with</span></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-full font-bold hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <div className="text-center space-y-4">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors font-serif italic underline underline-offset-4"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
            <div className="h-px bg-stone-50 dark:bg-stone-800" />
            <button 
              onClick={() => setDemoMode(true)}
              className="text-sm font-bold text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        <p className="mt-8 text-stone-400 text-[10px] font-serif italic text-center">
          Your progress is saved to your account. Guest data is saved locally.
        </p>
      </motion.div>
    </div>
  );
};

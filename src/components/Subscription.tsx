import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { 
  addDoc, 
  collection, 
  Timestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { 
  Award, 
  Check, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  CloudSun, 
  Loader2, 
  Send, 
  Image as ImageIcon,
  Upload,
  RefreshCw
} from 'lucide-react';
import { cn, safeStorage, getSafeDate } from '../lib/utils';
import { format } from 'date-fns';

export const Subscription = () => {
    const { profile, user, isDemo, setProfile } = useContext(AuthContext);
    const [selectedPlan, setSelectedPlan] = useState('lifetime');
    const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  
    const plans = [
      { id: '3months', name: 'Starter', price: '99', period: '3 Months', badge: null, color: 'stone', savings: 'Basic tier', durationDays: 90 },
      { id: '6months', name: 'Growth', price: '169', period: '6 Months', badge: 'Popular', color: 'blue', savings: 'Save 15%', durationDays: 180 },
      { id: '12months', name: 'Focus', price: '299', period: '12 Months', badge: 'Best Value', color: 'emerald', savings: 'Save 25%', durationDays: 365 },
      { id: 'lifetime', name: 'Sensei Mastery', price: '499', period: 'Lifetime', badge: 'Professional', color: '#f2a93b', savings: 'Pay once', durationDays: 99999 }
    ];
  
    const handlePayUPI = (plan: typeof plans[0]) => {
      if (isDemo) {
        alert("UPI Payment is not available in Demo mode. Click 'Confirm Payment Simulation' below to test premium features.");
        setIsSimulatingPayment(true);
        return;
      }
      const upiId = "ritesh7503@ybl";
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent("Sensei Chat " + plan.name)}&am=${plan.price}&cu=INR`;
      window.location.href = upiLink;
      setIsSimulatingPayment(true);
    };
  
    const [transactionId, setTransactionId] = useState('');
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
  
    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 1024 * 1024) { // 1MB limit
          alert("Image is too large. Please upload a screenshot smaller than 1MB.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshot(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
  
    const handleSubmitRequest = async () => {
      if (!transactionId.trim() || !user) return;
      setSubmitting(true);
      try {
        const plan = plans.find(p => p.id === selectedPlan) || plans[3];
        await addDoc(collection(db, 'payment_requests'), {
          userId: user.uid,
          userEmail: user.email,
          userCustomId: profile?.customId || 'Unknown',
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          transactionId: transactionId.trim(),
          screenshotUrl: screenshot,
          status: 'pending',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        alert("Payment verification request sent! Our admin will review your transaction and activate your features shortly.");
        setTransactionId('');
        setScreenshot(null);
        setIsSimulatingPayment(false);
      } catch (e) {
        console.error("Error submitting request:", e);
        alert("Failed to submit request. Please try again.");
      } finally {
        setSubmitting(false);
      }
    };
  
    const handleSimulateSuccess = async () => {
      const plan = plans.find(p => p.id === selectedPlan) || plans[3];
      const expiryDate = plan.id === 'lifetime' ? null : new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
      
      const updates = {
        isPremium: true,
        subscriptionPlan: plan.id,
        premiumExpiry: expiryDate ? Timestamp.fromDate(expiryDate) : null
      };
  
      if (isDemo) {
        const p = { ...profile, ...updates };
        setProfile(p as any); // Cast as any because of local context differences
        safeStorage.setItem('komorebi_profile', JSON.stringify(p));
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid), updates);
      }
      setIsSimulatingPayment(false);
      alert(`Success! You have been upgraded to the ${plan.name} plan.`);
    };
  
    const activePlan = plans.find(p => p.id === (profile?.subscriptionPlan || ''));
  
    if (profile?.isPremium && activePlan) {
      return (
        <div className="max-w-5xl mx-auto space-y-12 pb-24 px-4 pt-4">
          <section className="text-center space-y-6">
            <div className="flex justify-center">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="p-6 bg-[#f2a93b] rounded-[2.5rem] shadow-2xl shadow-amber-200 dark:shadow-none relative"
              >
                <Award className="w-12 h-12 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-stone-900 rounded-full flex items-center justify-center border-2 border-[#f2a93b]">
                  <Check className="w-4 h-4 text-[#f2a93b]" />
                </div>
              </motion.div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-editorial text-stone-900 dark:text-stone-100">You are a Premium Sensei!</h1>
              <p className="text-stone-500 dark:text-stone-400 font-serif text-lg decoration-[#f2a93b] decoration-2 underline-offset-4 underline uppercase tracking-widest">Active Plan: {activePlan.name}</p>
            </div>
          </section>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] border-2 border-[#f2a93b] shadow-xl space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-editorial text-stone-900 dark:text-stone-100">Subscription Status</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#f2a93b] mt-1">{activePlan.name} Tier</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</div>
              </div>
  
              <div className="space-y-4">
                <div className="flex justify-between items-center py-4 border-b border-stone-50 dark:border-stone-800">
                  <span className="text-xs text-stone-500 font-serif uppercase tracking-widest">Price Paid</span>
                  <span className="text-lg font-bold text-stone-900 dark:text-white uppercase tracking-widest">₹{activePlan.price}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-stone-50 dark:border-stone-800">
                  <span className="text-xs text-stone-500 font-serif uppercase tracking-widest">Access Period</span>
                  <span className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-widest">{activePlan.period}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-xs text-stone-500 font-serif uppercase tracking-widest">Expires On</span>
                  <span className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-widest">
                    {profile.premiumExpiry ? format(getSafeDate(profile.premiumExpiry), 'MMM dd, yyyy') : 'No Expiry (Lifetime)'}
                  </span>
                </div>
              </div>
  
              <button className="w-full py-4 bg-stone-50 dark:bg-stone-800 text-stone-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest cursor-not-allowed">
                Manage Billing (Contact Support)
              </button>
            </div>
  
            <div className="bg-stone-50 dark:bg-stone-900/50 p-10 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 space-y-8">
              <h3 className="text-2xl font-editorial text-stone-900 dark:text-stone-100">Need more power?</h3>
              <p className="text-sm text-stone-500 font-serif leading-relaxed">
                If your current plan isn't enough, you can upgrade to a higher tier at any time. Moving to <span className="text-[#f2a93b] font-bold uppercase tracking-widest">Sensei Mastery</span> will give you lifetime access and unlock all future AI capabilities.
              </p>
              {activePlan.id !== 'lifetime' && (
                <button 
                  onClick={() => setProfile({ ...profile, isPremium: false })}
                  className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[1.5rem] font-bold text-sm shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Explore Upgrade Options
                </button>
              )}
              <p className="text-[10px] text-stone-400 text-center uppercase tracking-widest font-bold">Upgrading will replace your current subscription period.</p>
            </div>
          </div>
  
          <div className="pt-12 border-t border-stone-100 dark:border-stone-800">
             <h3 className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-8">Premium Benefits Unlocked</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: Sparkles, label: 'No AI Limits' },
                  { icon: ShieldCheck, label: 'Priority Support' },
                  { icon: CloudSun, label: 'Cloud Sync' },
                  { icon: Award, label: 'Exclusive Title' }
                ].map((benefit, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                     <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center shadow-sm">
                        <benefit.icon className="w-5 h-5 text-[#f2a93b]" />
                     </div>
                     <span className="text-[9px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300">{benefit.label}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      );
    }
  
    return (
      <div className="max-w-5xl mx-auto space-y-16 pb-24 px-4 pt-4">
        <section className="text-center space-y-6">
          <div className="flex justify-center">
            <motion.div 
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-[2rem] shadow-2xl shadow-amber-200 dark:shadow-none"
            >
              <Zap className="w-8 h-8 text-white fill-current" />
            </motion.div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-editorial text-stone-900 dark:text-stone-100 uppercase tracking-tight">Komorebi Premium</h1>
            <p className="text-stone-500 dark:text-stone-400 font-serif text-lg max-w-xl mx-auto uppercase tracking-widest opacity-60">
              Break free from daily limits and accelerate your Japanese mastery with unlimited AI-powered learning.
            </p>
          </div>
        </section>
  
        {isSimulatingPayment && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-[3rem] text-center space-y-8 shadow-2xl"
          >
            <div className="space-y-2">
              <div className="flex justify-center">
                 <RefreshCw className="w-10 h-10 text-[#f2a93b] animate-spin" />
              </div>
              <h3 className="text-2xl font-editorial text-stone-900 dark:text-stone-100">Verifying Payment</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 font-serif max-w-sm mx-auto">Once you've completed the UPI transfer, enter your 12-digit UTR/Transaction ID below and upload a screenshot for faster verification.</p>
              <div className="mt-4 p-4 bg-stone-100 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
                 <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">Your Personal Payment ID</p>
                 <p className="text-lg font-mono font-bold text-stone-900 dark:text-white tracking-widest">{profile?.customId || '------'}</p>
              </div>
            </div>
  
            {!isDemo ? (
              <div className="max-w-xs mx-auto space-y-4">
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="12-digit Transaction ID (UTR)" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-[#f2a93b] outline-none"
                  />
                  
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-left px-2">Upload Payment Screenshot</p>
                     <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-stone-900 border-2 border-stone-200 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-amber-400 focus:outline-none">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          {screenshot ? (
                            <div className="relative group">
                               <img src={screenshot} alt="Screenshot" className="w-20 h-20 object-cover rounded-lg" />
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <ImageIcon className="w-6 h-6 text-white" />
                               </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-stone-300" />
                              <span className="text-xs font-serif text-stone-400">Click to upload screenshot</span>
                            </>
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotChange} />
                     </label>
                  </div>
                </div>
  
                <button 
                  onClick={handleSubmitRequest}
                  disabled={submitting || !transactionId}
                  className="w-full py-4 bg-[#f2a93b] text-white rounded-2xl font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Verification Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Demo Mode: Simulation Available</p>
                <button 
                   onClick={handleSimulateSuccess}
                   className="px-10 py-5 bg-[#f2a93b] text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-amber-200 dark:shadow-none hover:scale-[1.05] active:scale-95 transition-all"
                >
                  Confirm Payment Simulation
                </button>
              </div>
            )}
            
            <button 
              onClick={() => setIsSimulatingPayment(false)}
              className="text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-900"
            >
              Go Back to Options
            </button>
          </motion.div>
        )}
  
        {!isSimulatingPayment && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <motion.div 
                key={plan.id}
                whileHover={{ y: -10 }}
                className={cn(
                  "relative p-8 rounded-[3rem] border-2 transition-all flex flex-col justify-between space-y-8",
                  selectedPlan === plan.id 
                    ? "bg-white dark:bg-stone-900 border-[#f2a93b] shadow-2xl shadow-amber-100 dark:shadow-none ring-4 ring-amber-50 dark:ring-stone-800" 
                    : "bg-stone-50 dark:bg-stone-800/50 border-transparent hover:border-stone-200 dark:hover:border-stone-700"
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#f2a93b] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}
  
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">{plan.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#f2a93b] mt-1">{plan.savings}</p>
                  </div>
  
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-medium text-stone-900 dark:text-stone-100 italic tracking-tight">₹{plan.price}</span>
                    <span className="text-xs text-stone-400 font-serif">/ {plan.period}</span>
                  </div>
  
                  <div className="h-px bg-stone-100 dark:bg-stone-800" />
  
                  <ul className="space-y-3">
                     {[
                       'No Daily Limits',
                       'Priority Sensei AI',
                       'All Rank Rewards',
                       'Advanced Lessons',
                       plan.id === 'lifetime' ? 'Lifetime Access' : 'Full Support'
                     ].map((feat, i) => (
                       <li key={i} className="flex items-center gap-2 text-[11px] font-serif italic text-stone-500 dark:text-stone-400">
                          <Check className="w-3 h-3 text-emerald-500" />
                          {feat}
                       </li>
                     ))}
                  </ul>
                </div>
  
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePayUPI(plan);
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg",
                    selectedPlan === plan.id 
                      ? "bg-[#f2a93b] text-white hover:bg-amber-600" 
                      : "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                  )}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        )}
  
        <section className="bg-stone-900 dark:bg-white p-12 rounded-[4rem] text-center space-y-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="grid grid-cols-12 h-full gap-4">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="w-full h-12 border-l border-white dark:border-stone-900" />
                ))}
             </div>
          </div>
  
          <div className="relative z-10 space-y-4">
             <h3 className="text-3xl font-editorial italic text-white dark:text-stone-900">Experience everything without limits.</h3>
             <p className="text-stone-400 dark:text-stone-500 font-serif max-w-2xl mx-auto italic">
               Whether you're preparing for the JLPT or just want to connect with Japanese culture, Premium gives you the tools to succeed faster.
             </p>
          </div>
          
          <div className="relative z-10 flex flex-wrap justify-center gap-12">
            {[
              { label: 'Sensei Chat', value: 'Unlimited', desc: 'No daily tokens' },
              { label: 'Vocabulary', value: 'Infinite', desc: 'Full cloud sync' },
              { label: 'Features', value: 'Standard', desc: 'Priority updates' },
              { label: 'Ads', value: 'None', desc: 'Distraction free' }
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-2xl font-display font-medium text-white dark:text-stone-900 italic tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f2a93b]">{stat.label}</div>
                <div className="text-[9px] text-stone-500 font-serif lowercase mt-1">{stat.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
};

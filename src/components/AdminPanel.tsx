import React, { useState, useEffect, useContext } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { 
  Check, 
  XCircle, 
  Loader2, 
  Image as ImageIcon 
} from 'lucide-react';
import { cn, formatSafeDate } from '../lib/utils';

export const AdminPanel = () => {
  const { profile } = useContext(AuthContext);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' || profile?.email === "riteshkumar477823@gmail.com";

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAction = async (request: any, status: 'approved' | 'rejected') => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'payment_requests', request.id), {
        status,
        updatedAt: Timestamp.now()
      });

      // 2. If approved, upgrade user
      if (status === 'approved') {
        const durationDays = request.planId === '3months' ? 90 : 
                           request.planId === '6months' ? 180 : 
                           request.planId === '12months' ? 365 : 
                           99999;
        
        const expiryDate = request.planId === 'lifetime' ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        
        await updateDoc(doc(db, 'users', request.userId), {
          isPremium: true,
          subscriptionPlan: request.planId,
          premiumExpiry: expiryDate ? Timestamp.fromDate(expiryDate) : null,
          role: 'user' // Ensure they are marked as user
        });
      }

      alert(`Request ${status} successfully.`);
    } catch (e) {
      console.error("Error updating request:", e);
      alert("Failed to update request.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-editorial italic text-stone-900 dark:text-stone-100">Access Denied</h2>
        <p className="text-stone-500 font-serif">You do not have administrative privileges.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 pt-4">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f2a93b]">Control Center</span>
          <h1 className="text-5xl font-editorial italic text-stone-900 dark:text-stone-100 tracking-tight">Admin Panel</h1>
        </div>
        <div className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl">
          {requests.filter(r => r.status === 'pending').length} Pending Requests
        </div>
      </header>

      <div className="bg-white dark:bg-stone-900 rounded-[3.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/30">
                <th className="py-6 px-10 text-[10px] font-bold uppercase tracking-widest text-stone-400">User / customId</th>
                <th className="py-6 px-10 text-[10px] font-bold uppercase tracking-widest text-stone-400">Transaction Info</th>
                <th className="py-6 px-10 text-[10px] font-bold uppercase tracking-widest text-stone-400">Screenshot</th>
                <th className="py-6 px-10 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
              {requests.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-stone-400 font-serif">No requests found.</td>
                </tr>
              )}
              {requests.map((req) => (
                <tr key={req.id} className="group hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                  <td className="py-6 px-10">
                    <div className="font-bold text-stone-900 dark:text-stone-100">{req.userEmail}</div>
                    <div className="text-[10px] text-[#f2a93b] font-bold uppercase tracking-widest">ID: {req.userCustomId || '---'}</div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{req.planName} (₹{req.price})</div>
                  </td>
                  <td className="py-6 px-10">
                    <div className="space-y-1">
                      <code className="text-xs font-mono bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20">{req.transactionId}</code>
                      <div className="text-[10px] text-stone-400 tabular-nums px-1">
                        {req.createdAt ? formatSafeDate(req.createdAt, 'MMM dd, HH:mm') : '-'}
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-10">
                     {req.screenshotUrl ? (
                        <button 
                          onClick={() => window.open(req.screenshotUrl, '_blank')}
                          className="relative group w-16 h-12 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 hover:scale-105 transition-transform"
                        >
                           <img src={req.screenshotUrl} alt="Payment" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon className="w-4 h-4 text-white" />
                           </div>
                        </button>
                     ) : (
                       <span className="text-[8px] text-stone-400 bg-stone-100 px-2 py-1 rounded">No Screenshot</span>
                     )}
                  </td>
                  <td className="py-6 px-10 text-right">
                    <div className="flex flex-col items-end gap-2">
                       <span className={cn(
                        "px-3 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                        req.status === 'pending' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" :
                        req.status === 'approved' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                        "bg-red-50 dark:bg-red-900/20 text-red-600"
                      )}>
                        {req.status}
                      </span>
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleAction(req, 'approved')}
                            className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(req, 'rejected')}
                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

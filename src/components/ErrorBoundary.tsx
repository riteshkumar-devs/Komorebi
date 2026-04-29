import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('{"error":')) {
        try {
          const parsed = JSON.parse(event.error.message);
          setHasError(true);
          setErrorDetails(parsed);
        } catch (e) {
          setHasError(true);
          setErrorDetails({ error: event.error.message });
        }
      } else {
        setHasError(true);
        setErrorDetails({ error: event.error?.message || "An unexpected error occurred" });
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-2xl p-8 border border-stone-100 dark:border-stone-800 space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Something went wrong</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-serif italic">
              {errorDetails?.error || "We encountered an error while processing your request."}
            </p>
          </div>

          {errorDetails?.operationType && (
            <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                <span>Operation</span>
                <span className="text-stone-900 dark:text-stone-100">{errorDetails.operationType}</span>
              </div>
              {errorDetails.path && (
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <span>Resource</span>
                  <span className="text-stone-900 dark:text-stone-100 truncate max-w-[150px]">{errorDetails.path}</span>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => {
              setHasError(false);
              setErrorDetails(null);
            }}
            className="w-full py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <p className="text-[10px] text-center text-stone-400 font-serif italic">
            If this persists, please check your internet connection or API keys in Settings.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

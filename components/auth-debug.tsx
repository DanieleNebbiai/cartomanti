"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

export default function AuthDebug() {
  const { user, loading, isAuthenticated, recoverSession } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkDebugInfo = async () => {
      const supabase = createClient();
      
      try {
        // Get session info
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Get localStorage info
        const localStorageInfo = typeof window !== 'undefined' ? {
          authKeys: Object.keys(localStorage).filter(key => 
            key.includes('supabase') || key.includes('auth')
          ),
          hasAuthData: localStorage.getItem('sb-ejuvwspegzaiczjqygau-auth-token') !== null,
        } : null;

        setDebugInfo({
          user: {
            id: user?.id,
            email: user?.email,
            created_at: user?.created_at,
          },
          session: {
            hasSession: !!session,
            userId: session?.user?.id,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            accessTokenPrefix: session?.access_token?.slice(0, 20) + '...',
          },
          auth: {
            loading,
            isAuthenticated,
          },
          localStorage: localStorageInfo,
          sessionError: sessionError?.message,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };

    checkDebugInfo();
    const interval = setInterval(checkDebugInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [user, loading, isAuthenticated]);

  // Show debug info only in development or when specifically enabled
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=true')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-red-600 text-white px-3 py-1 rounded text-xs"
      >
        Auth Debug {isVisible ? '−' : '+'}
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-black bg-opacity-90 text-green-400 p-4 rounded max-w-md overflow-auto max-h-96 text-xs font-mono">
          <div className="mb-2 space-x-2">
            <button
              onClick={recoverSession}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
            >
              Recover Session
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 text-white px-2 py-1 rounded text-xs"
            >
              Reload Page
            </button>
          </div>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
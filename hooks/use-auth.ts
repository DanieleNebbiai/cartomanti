"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));

  // Function to manually recover session
  const recoverSession = useCallback(async () => {
    console.log("useAuth: Manually recovering session...");
    setLoading(true);

    try {
      // First try to refresh the session
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();
      console.log("useAuth: Manual refresh result:", {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message,
      });

      if (session?.user) {
        setUser(session.user);
        return true;
      }

      // If refresh failed, try to get the session from storage
      const {
        data: { session: storedSession },
      } = await supabase.auth.getSession();
      if (storedSession?.user) {
        setUser(storedSession.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error("useAuth: Manual recovery failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        // Try to get the session first
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        // Then get the user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        // If we have a session but no user, try to refresh the session
        if (session && !user && !error) {
          console.log(
            `useAuth[${instanceId.current}]: Have session but no user, attempting to refresh...`
          );
          const {
            data: { user: refreshedUser },
            error: refreshError,
          } = await supabase.auth.refreshSession();
          console.log(`useAuth[${instanceId.current}]: Refresh result:`, {
            user: !!refreshedUser,
            error: refreshError,
          });
          setUser(refreshedUser || null);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error(
          `useAuth[${instanceId.current}]: Error getting user:`,
          error
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log(
        `useAuth[${instanceId.current}]: Auth timeout - forcing loading to false`
      );
      setLoading(false);
    }, 10000); // 10 seconds timeout

    getUser().finally(() => clearTimeout(timeout));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event !== "TOKEN_REFRESHED") setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isAuthenticated = !!user;

  return {
    user,
    loading,
    isAuthenticated,
    signOut,
    recoverSession,
  };
}

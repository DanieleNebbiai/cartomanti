"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";

interface TrialUsage {
  totalSeconds: number;
  month: string;
  lastUpdated: Date;
  userId: string;
}

const TRIAL_LIMIT_SECONDS = 10 * 60; // 10 minutes in seconds

export function useTrialUsage() {
  const [usage, setUsage] = useState<TrialUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const supabase = createClient();
  const currentUsageRef = useRef<TrialUsage | null>(null);
  const lastSaveRef = useRef<Date | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current month key (YYYY-MM format)
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  // Load usage from Supabase
  const loadUsageFromSupabase = async () => {
    if (!user?.id) return;

    try {
      // Get user profile with free_trial_minutes_used
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("free_trial_minutes_used")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading user profile:", error);
        // Create default usage
        const newUsage: TrialUsage = {
          totalSeconds: 0,
          month: getCurrentMonth(),
          lastUpdated: new Date(),
          userId: user.id,
        };
        setUsage(newUsage);
        currentUsageRef.current = newUsage;
        return;
      }

      const totalSeconds = (profile?.free_trial_minutes_used || 0) * 60; // Convert minutes to seconds
      const currentMonth = getCurrentMonth();

      const newUsage: TrialUsage = {
        totalSeconds,
        month: currentMonth,
        lastUpdated: new Date(),
        userId: user.id,
      };

      setUsage(newUsage);
      currentUsageRef.current = newUsage;
    } catch (error) {
      console.error("Error loading trial usage:", error);
      const newUsage: TrialUsage = {
        totalSeconds: 0,
        month: getCurrentMonth(),
        lastUpdated: new Date(),
        userId: user.id,
      };
      setUsage(newUsage);
      currentUsageRef.current = newUsage;
    } finally {
      setIsLoading(false);
    }
  };

  // Save usage to Supabase
  const saveUsageToSupabase = async (newUsage: TrialUsage) => {
    if (!user?.id) return;

    try {
      const minutesUsed = Math.ceil(newUsage.totalSeconds / 60); // Convert seconds to minutes (round up)

      console.log("Saving usage to Supabase:", {
        userId: user.id,
        totalSeconds: newUsage.totalSeconds,
        minutesUsed,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          free_trial_minutes_used: minutesUsed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error saving usage to Supabase:", error);
      } else {
        console.log("Successfully saved usage to Supabase");
      }

      setUsage(newUsage);
      currentUsageRef.current = newUsage;
    } catch (error) {
      console.error("Error saving trial usage:", error);
    }
  };

  // Start periodic save interval (every 15 seconds)
  const startPeriodicSave = useCallback(() => {
    console.log("Starting periodic save interval (every 15 seconds)");
    saveIntervalRef.current = setInterval(() => {
      if (currentUsageRef.current && user?.id) {
        console.log("Periodic save triggered");
        saveUsageToSupabase(currentUsageRef.current);
      }
    }, 15000); // Save every 15 seconds
  }, [user?.id]);

  // Stop periodic save interval
  const stopPeriodicSave = useCallback(() => {
    if (saveIntervalRef.current) {
      console.log("Stopping periodic save interval");
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  }, []);

  // Force save to Supabase (called when conversation ends)
  const forceSave = useCallback(async () => {
    if (currentUsageRef.current && user?.id) {
      console.log("Force saving usage to Supabase");
      await saveUsageToSupabase(currentUsageRef.current);
    }
  }, [user?.id]);

  // Add seconds to usage - only update local state, batch saves
  const addUsage = useCallback(
    (seconds: number) => {
      console.log("addUsage called:", {
        seconds,
        currentUsage: currentUsageRef.current,
        isAuthenticated,
        userId: user?.id,
      });

      if (!currentUsageRef.current || !isAuthenticated || !user?.id) {
        console.log("addUsage early return - no usage or not authenticated");
        return;
      }

      const newUsage: TrialUsage = {
        ...currentUsageRef.current,
        totalSeconds: Math.min(
          currentUsageRef.current.totalSeconds + seconds,
          TRIAL_LIMIT_SECONDS + 60
        ), // Allow slight overflow for UX
        lastUpdated: new Date(),
      };

      console.log("addUsage updating (local only):", {
        oldTotal: currentUsageRef.current.totalSeconds,
        newTotal: newUsage.totalSeconds,
      });

      // Update local state immediately for UI responsiveness
      currentUsageRef.current = newUsage;
      setUsage(newUsage);

      // Database saves are handled by periodic interval
    },
    [isAuthenticated, user?.id]
  );

  // Check if user has exceeded the limit
  const hasExceededLimit = () => {
    return usage ? usage.totalSeconds >= TRIAL_LIMIT_SECONDS : false;
  };

  // Get remaining seconds
  const getRemainingSeconds = () => {
    if (!usage) return TRIAL_LIMIT_SECONDS;
    return Math.max(0, TRIAL_LIMIT_SECONDS - usage.totalSeconds);
  };

  // Get remaining minutes (rounded up)
  const getRemainingMinutes = () => {
    return Math.ceil(getRemainingSeconds() / 60);
  };

  // Get used minutes
  const getUsedMinutes = () => {
    if (!usage) return 0;
    return Math.floor(usage.totalSeconds / 60);
  };

  // Get used seconds (remainder)
  const getUsedSecondsRemainder = () => {
    if (!usage) return 0;
    return usage.totalSeconds % 60;
  };

  // Reset usage (for testing or admin purposes)
  const resetUsage = async () => {
    if (!isAuthenticated || !user?.id) return;

    const newUsage: TrialUsage = {
      totalSeconds: 0,
      month: getCurrentMonth(),
      lastUpdated: new Date(),
      userId: user.id,
    };
    await saveUsageToSupabase(newUsage);
  };

  // Load usage when user changes
  useEffect(() => {
    if (!isAuthenticated) {
      setUsage(null);
      currentUsageRef.current = null;
      stopPeriodicSave();
      setIsLoading(false);
      return;
    }

    if (user?.id) {
      loadUsageFromSupabase();
    }
  }, [user?.id, isAuthenticated, stopPeriodicSave]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      stopPeriodicSave();
    };
  }, [stopPeriodicSave]);

  return {
    usage,
    isLoading,
    addUsage,
    hasExceededLimit,
    getRemainingSeconds,
    getRemainingMinutes,
    getUsedMinutes,
    getUsedSecondsRemainder,
    resetUsage,
    startPeriodicSave,
    stopPeriodicSave,
    forceSave,
    trialLimitSeconds: TRIAL_LIMIT_SECONDS,
    trialLimitMinutes: TRIAL_LIMIT_SECONDS / 60,
    isAuthenticated,
    user,
  };
}

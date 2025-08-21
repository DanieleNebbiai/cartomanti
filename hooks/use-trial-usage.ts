"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";

interface TrialUsage {
  userId: string;
  activatedAt: Date | null;
  expiresAt: Date | null;
  isExpired: boolean;
  hasActiveSubscription: boolean;
  hasEverHadSubscription: boolean;
}


export function useTrialUsage() {
  const [usage, setUsage] = useState<TrialUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const supabase = createClient();
  const currentUsageRef = useRef<TrialUsage | null>(null);


  // Load usage from Supabase
  const loadUsageFromSupabase = async () => {
    if (!user?.id) return;

    try {
      // Get user profile with trial expiry fields and subscription status
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("free_trial_activated_at, free_trial_expires_at, subscription_status, subscription_started_at")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading user profile:", error);
        // Create default usage - user needs to activate trial
        const newUsage: TrialUsage = {
          userId: user.id,
          activatedAt: null,
          expiresAt: null,
          isExpired: false,
          hasActiveSubscription: false,
          hasEverHadSubscription: false,
        };
        setUsage(newUsage);
        currentUsageRef.current = newUsage;
        return;
      }

      const activatedAt = profile?.free_trial_activated_at ? new Date(profile.free_trial_activated_at) : null;
      const expiresAt = profile?.free_trial_expires_at ? new Date(profile.free_trial_expires_at) : null;
      const isExpired = expiresAt ? new Date() > expiresAt : false;
      const hasActiveSubscription = profile?.subscription_status === 'active';
      const hasEverHadSubscription = !!profile?.subscription_started_at;

      const newUsage: TrialUsage = {
        userId: user.id,
        activatedAt,
        expiresAt,
        isExpired,
        hasActiveSubscription,
        hasEverHadSubscription,
      };

      setUsage(newUsage);
      currentUsageRef.current = newUsage;
    } catch (error) {
      console.error("Error loading trial usage:", error);
      const newUsage: TrialUsage = {
        userId: user.id,
        activatedAt: null,
        expiresAt: null,
        isExpired: false,
        hasActiveSubscription: false,
        hasEverHadSubscription: false,
      };
      setUsage(newUsage);
      currentUsageRef.current = newUsage;
    } finally {
      setIsLoading(false);
    }
  };



  // Activate trial for user (sets expiry to 1 month from now)
  const activateTrial = async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 1); // Add 1 month

      const { error } = await supabase
        .from("profiles")
        .update({
          free_trial_activated_at: now.toISOString(),
          free_trial_expires_at: expiryDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error activating trial:", error);
        return;
      }

      // Reload usage to reflect new trial activation
      await loadUsageFromSupabase();
    } catch (error) {
      console.error("Error activating trial:", error);
    }
  };



  // Check if user has exceeded the limit
  const hasExceededLimit = () => {
    if (!usage) return false;
    
    // If user has active subscription, no limits
    if (usage.hasActiveSubscription) return false;
    
    // If user has ever had a subscription but it's now inactive, block immediately
    if (usage.hasEverHadSubscription && !usage.hasActiveSubscription) {
      return true; // Must resubscribe to continue
    }
    
    // For new users, check if trial period has expired
    if (!usage.activatedAt || !usage.expiresAt) {
      return false; // New user, trial not yet activated
    }
    
    // Trial period has expired
    return usage.isExpired;
  };

  // Get remaining seconds (now based on remaining time until expiry)
  const getRemainingSeconds = () => {
    if (!usage || !usage.expiresAt || usage.isExpired) return 0;
    return Math.max(0, Math.floor((usage.expiresAt.getTime() - new Date().getTime()) / 1000));
  };

  // Get remaining days/hours/minutes
  const getRemainingDays = () => {
    const remainingSeconds = getRemainingSeconds();
    return Math.floor(remainingSeconds / (24 * 60 * 60));
  };

  const getRemainingMinutes = () => {
    return Math.ceil(getRemainingSeconds() / 60);
  };


  // Reset trial (for testing or admin purposes)
  const resetTrial = async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          free_trial_activated_at: null,
          free_trial_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error resetting trial:", error);
        return;
      }

      // Reload usage to reflect reset
      await loadUsageFromSupabase();
    } catch (error) {
      console.error("Error resetting trial:", error);
    }
  };

  // Load usage when user changes
  useEffect(() => {
    if (!isAuthenticated) {
      setUsage(null);
      currentUsageRef.current = null;
      setIsLoading(false);
      return;
    }

    if (user?.id) {
      loadUsageFromSupabase();
    }
  }, [user?.id, isAuthenticated]);

  return {
    usage,
    isLoading,
    hasExceededLimit,
    getRemainingSeconds,
    getRemainingMinutes,
    getRemainingDays,
    resetTrial,
    activateTrial,
    isAuthenticated,
    user,
  };
}

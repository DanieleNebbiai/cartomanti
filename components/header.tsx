"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LogOut, UserIcon } from "lucide-react";

interface HeaderProps {
  onAuthClick: () => void;
  dark?: boolean;
}

export default function Header({ onAuthClick, dark = false }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const supabase = createClient();

  const textColor = dark ? "text-white" : "text-earth-900";
  const hoverColor = dark ? "hover:text-sage-300" : "hover:text-sage-600";

  useEffect(() => {
    // Check if Supabase is configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setSupabaseConfigured(false);
      setLoading(false);
      return;
    }

    // Get initial session
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error getting user:", error);
        setSupabaseConfigured(false);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    return (
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente"
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <img 
            src="/favicon.ico" 
            alt="Cartomanti Logo" 
            className="w-8 h-8 group-hover:animate-pulse"
          />
          <span
            className={`font-playfair text-2xl font-bold ${textColor} ${hoverColor} transition-colors`}
          >
            Cartomanti.online
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`${textColor} ${hoverColor} transition-colors font-medium`}
          >
            Home
          </Link>
          <Link
            href="/operatori"
            className={`${textColor} ${hoverColor} transition-colors font-medium`}
          >
            Operatori
          </Link>
          <Link
            href="/consulto"
            className={`${textColor} ${hoverColor} transition-colors font-medium`}
          >
            Consulto
          </Link>
          <span className={`${textColor} opacity-75`}>•</span>
          <span className={`${textColor} text-sm`}>📞 Disponibili 24/7</span>
        </nav>

        <div className="flex items-center gap-4">
          {!supabaseConfigured ? (
            <div className={`${textColor} text-sm`}>Auth non disponibile</div>
          ) : loading ? (
            <div className="w-20 h-10 bg-white/20 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <UserIcon className={`h-4 w-4 ${textColor}`} />
                <span className={`${textColor} text-sm hidden sm:inline`}>
                  Ciao, {getUserDisplayName()}
                </span>
              </div>
              <Button
                onClick={handleSignOut}
                variant={dark ? "outline" : "default"}
                size="sm"
                className={
                  dark
                    ? "border-earth/30 bg-earth-400  text-earth-200 hover:bg-red-700"
                    : "bg-earth-400 hover:bg-red-700 text-earth-2"
                }
              >
                <LogOut className="h-4 w-4 mr-1" />
                Esci
              </Button>
            </div>
          ) : (
            <Button
              onClick={onAuthClick}
              variant={dark ? "outline" : "default"}
              className={
                dark
                  ? "bg-sage-600 hover:bg-sage-700 text-white"
                  : "bg-sage-600 hover:bg-sage-700 text-white"
              }
            >
              Accedi
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

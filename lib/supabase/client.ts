import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return existing client if already created
  if (client) {
    return client;
  }

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
    });

    // Return a mock client for development/preview
    return {
      auth: {
        signInWithPassword: async () => ({
          data: null,
          error: { message: "Supabase not configured" },
        }),
        signUp: async () => ({
          data: null,
          error: { message: "Supabase not configured" },
        }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        getSession: async () => ({ data: { session: null }, error: null }),
        refreshSession: async () => ({
          data: { session: null, user: null },
          error: null,
        }),
      },
    } as any;
  }

  // Create the client
  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}

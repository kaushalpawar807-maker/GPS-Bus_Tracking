import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, role: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // This function is now crucial and remains the single source of truth for loading the profile
  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
    } else {
      console.error('Error loading profile after auth:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Session change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (() => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: string, fullName: string) => {
    // 1. Perform Auth Signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    
    // Check for user in the immediate response
    if (data.user) {
      // 2. *** CRITICAL FIX: Wait for the session to be fully refreshed in the client ***
      // We explicitly wait for the new session to confirm the user is fully 'authenticated'.
      // This is often needed when immediate database action follows auth.
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // 3. Create the profile, now with a solid authenticated session
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              // Crucially, we must ensure the ID is set to the newly created user's ID
              id: session.user.id, 
              email,
              role,
              full_name: fullName,
            },
          ]);

        if (profileError) throw profileError;
        
        // As a final measure, explicitly load the profile right after creation
        await loadProfile(session.user.id);
        
      } else {
        // This case should ideally not happen if signup succeeded, but handles edge cases.
        throw new Error("Signup successful but session failed to load immediately.");
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
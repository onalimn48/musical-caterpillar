import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { hasSupabaseConfig, supabase } from './supabaseClient.js';

const TeacherAuthContext = createContext(null);

async function loadTeacherProfile(userId) {
  const { data, error } = await supabase
    .from('teachers')
    .select('id, email, approved, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export function TeacherAuthProvider({ children }) {
  const [state, setState] = useState({
    session: null,
    teacher: null,
    loading: true,
    error: '',
    configReady: hasSupabaseConfig,
  });

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setState({
        session: null,
        teacher: null,
        loading: false,
        error: 'Supabase is not configured for teacher sign-in.',
        configReady: false,
      });
      return undefined;
    }

    let active = true;

    async function syncTeacherSession(session) {
      if (!active) {
        return;
      }

      if (!session) {
        setState({
          session: null,
          teacher: null,
          loading: false,
          error: '',
          configReady: true,
        });
        return;
      }

      setState((current) => ({
        ...current,
        session,
        teacher: null,
        loading: true,
        error: '',
        configReady: true,
      }));

      try {
        const teacher = await loadTeacherProfile(session.user.id);

        if (!active) {
          return;
        }

        if (!teacher) {
          setState({
            session,
            teacher: null,
            loading: false,
            error: 'No teacher profile was found for this account.',
            configReady: true,
          });
          return;
        }

        setState({
          session,
          teacher,
          loading: false,
          error: '',
          configReady: true,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          session,
          teacher: null,
          loading: false,
          error: error.message || 'Unable to load teacher account.',
          configReady: true,
        });
      }
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        setState({
          session: null,
          teacher: null,
          loading: false,
          error: error.message,
          configReady: true,
        });
        return;
      }

      syncTeacherSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncTeacherSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    ...state,
    async signInWithPassword({ email, password }) {
      if (!supabase) {
        return { error: new Error('Supabase is not configured.') };
      }

      const result = await supabase.auth.signInWithPassword({ email, password });
      return { error: result.error };
    },
    async signUpWithPassword({ email, password }) {
      if (!supabase) {
        return { error: new Error('Supabase is not configured.') };
      }

      const result = await supabase.auth.signUp({ email, password });
      return { error: result.error, data: result.data };
    },
    async signOut() {
      if (!supabase) {
        return { error: null };
      }

      const result = await supabase.auth.signOut();
      return { error: result.error };
    },
  };

  return (
    <TeacherAuthContext.Provider value={value}>
      {children}
    </TeacherAuthContext.Provider>
  );
}

export function useTeacherAuth() {
  const context = useContext(TeacherAuthContext);

  if (!context) {
    throw new Error('useTeacherAuth must be used within TeacherAuthProvider.');
  }

  return context;
}

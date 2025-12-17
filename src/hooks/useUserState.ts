import { useState, useEffect, useCallback } from 'react';

type UserState = 'guest' | null;

const STORAGE_KEY = 'pageportals_user_state';

export function useUserState() {
  const [userState, setUserState] = useState<UserState>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'guest') {
      setUserState('guest');
    }
  }, []);

  const signInAsGuest = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'guest');
    setUserState('guest');
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUserState(null);
  }, []);

  return {
    userState,
    isGuest: userState === 'guest',
    signInAsGuest,
    signOut,
  };
}

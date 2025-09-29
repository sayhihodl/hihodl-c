import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

type State = { user: User|null; ready: boolean };
export const useAuthStore = create<State>(() => ({ user: null, ready: false }));

onAuthStateChanged(auth, (u) => useAuthStore.setState({ user: u, ready: true }));
export const useAuth = () => {
  const { user, ready } = useAuthStore();
  return { user, ready };
};

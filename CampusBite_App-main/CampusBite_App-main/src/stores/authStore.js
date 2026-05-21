import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

const useAuthStore = create((set, get) => ({
  user:  null,
  token: null,
  loading: true,
  logoutCallback: null,

  // Set logout callback
  setLogoutCallback: (callback) => set({ logoutCallback: callback }),

  // Called on app start — restores session from AsyncStorage
  hydrate: async () => {
    console.log('AuthStore: Hydrate called');
    try {
      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');
      console.log('AuthStore: Found token:', !!token);
      console.log('AuthStore: Found user:', !!userJson);
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        console.log('AuthStore: Restoring user session:', user);
        set({ token, user, loading: false });
      } else {
        console.log('AuthStore: No stored session found');
        set({ loading: false });
      }
    } catch (error) {
      console.error('AuthStore: Hydrate error:', error);
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    console.log('AuthStore: Login called with email:', email);
    try {
      const { data } = await api.auth.login({ email, password });
      console.log('AuthStore: Login response:', data);
      
      if (data.token && data.user) {
        console.log('AuthStore: Saving login token and user to AsyncStorage');
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        set({ token: data.token, user: data.user });
        console.log('AuthStore: Login complete, user saved:', data.user);
        return data.user;
      } else {
        console.error('AuthStore: Invalid login response - missing token or user');
        throw new Error('Invalid login response from server');
      }
    } catch (error) {
      console.error('AuthStore: Login error:', error);
      throw error;
    }
  },

  register: async (payload) => {
    console.log('AuthStore: Register called with payload:', { ...payload, password: '***' });
    try {
      const { data } = await api.auth.register(payload);
      console.log('AuthStore: Registration response:', data);
      
      if (data.token && data.user) {
        console.log('AuthStore: Saving token and user to AsyncStorage');
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        set({ token: data.token, user: data.user });
        console.log('AuthStore: Registration complete, user saved:', data.user);
        return data.user;
      } else {
        console.error('AuthStore: Invalid registration response - missing token or user');
        throw new Error('Invalid registration response from server');
      }
    } catch (error) {
      console.error('AuthStore: Registration error:', error);
      throw error;
    }
  },

  setSession: async (token, user) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  updateUser: (updates) =>
    set((state) => {
      const updated = { ...state.user, ...updates };
      AsyncStorage.setItem('user', JSON.stringify(updated));
      return { user: updated };
    }),

  logout: async () => {
    console.log('AuthStore: logout called');
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('AuthStore: AsyncStorage cleared');
      // Force state update with a fresh object to trigger reactivity
      const newState = { token: null, user: null };
      set(newState);
      console.log('AuthStore: state cleared, user should be null');
      // Call the logout callback if it exists
      const { logoutCallback } = get();
      if (logoutCallback) {
        console.log('AuthStore: calling logout callback');
        logoutCallback();
      }
    } catch (error) {
      console.error('AuthStore: logout error:', error);
    }
  },
}));

export { useAuthStore };
export default useAuthStore;

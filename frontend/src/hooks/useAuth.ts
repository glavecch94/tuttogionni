import { useState, useEffect, useCallback } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types';
import { authApi } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    localStorage.setItem('token', response.token);
    const userData: User = { email: response.email, name: response.name };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return response;
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    localStorage.setItem('token', response.token);
    const userData: User = { email: response.email, name: response.name };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return response;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}

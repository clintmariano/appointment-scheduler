import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  role: 'doctor' | 'assistant1' | 'assistant2';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Default users - stored in frontend
const DEFAULT_USERS = [
  {
    id: '1',
    username: 'doctor',
    password: 'doctor123',
    role: 'doctor' as const
  },
  {
    id: '2',
    username: 'assistant1',
    password: 'assistant123',
    role: 'assistant1' as const
  },
  {
    id: '3',
    username: 'assistant2',
    password: 'assistant123',
    role: 'assistant2' as const
  }
];

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Find user in default users
      const foundUser = DEFAULT_USERS.find(
        u => u.username === username && u.password === password
      );

      if (foundUser) {
        const userData: User = {
          id: foundUser.id,
          username: foundUser.username,
          role: foundUser.role
        };

        // Generate a simple token (in production, use proper JWT)
        const simpleToken = btoa(JSON.stringify({ userId: foundUser.id, timestamp: Date.now() }));
        
        setToken(simpleToken);
        setUser(userData);
        localStorage.setItem('auth_token', simpleToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, token }}>
      {children}
    </AuthContext.Provider>
  );
}
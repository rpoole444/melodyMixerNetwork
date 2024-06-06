import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation } from 'react-query';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  // Add other user properties as needed
}

interface UserContextProps {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const loginMutation = useMutation(async ({ email, password }: { email: string; password: string }) => {
    const response = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session: { email, password } }),
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    return data;
  }, {
    onSuccess: (data) => {
      console.log('Login successful:', data);
      setUser(data.data.attributes); // Ensure the correct user data structure
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const login = (email: string, password: string) => {
    loginMutation.mutate({ email, password });
  };

  const logout = async () => {
    await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'DELETE',
      credentials: 'include',
    });
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

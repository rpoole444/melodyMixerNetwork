import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiUser } from "@/lib/api";

type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface UserContextProps {
  user: ApiUser | null;
  status: AuthStatus;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: ApiUser) => Promise<void>;
  uploadProfileImage: (file: File, onProgress?: (percent: number) => void) => Promise<ApiUser>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      setStatus("loading");

      try {
        const currentUser = await api.currentUser();
        if (!isMounted) return;

        setUser(currentUser);
        setStatus(currentUser ? "authenticated" : "idle");
      } catch {
        if (!isMounted) return;

        setUser(null);
        setStatus("idle");
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setStatus("loading");
    setError("");

    try {
      const nextUser = await api.login(email, password);
      setUser(nextUser);
      setStatus("authenticated");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setStatus("idle");
  };

  const updateUser = async (nextUser: ApiUser) => {
    setStatus("loading");
    setError("");

    try {
      const savedUser = await api.updateUser(nextUser);
      setUser(savedUser);
      setStatus("authenticated");
    } catch (err) {
      setUser(nextUser);
      setStatus("authenticated");
      setError(err instanceof Error ? err.message : "Profile saved locally. Backend update failed.");
    }
  };

  const uploadProfileImage = async (file: File, onProgress?: (percent: number) => void) => {
    if (!user?.id) throw new Error("Sign in before changing your profile picture.");

    setError("");
    const savedUser = await api.uploadProfileImage(user.id, file, onProgress);
    setUser(savedUser);
    setStatus("authenticated");
    return savedUser;
  };

  const value = { user, status, error, login, logout, updateUser, uploadProfileImage };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

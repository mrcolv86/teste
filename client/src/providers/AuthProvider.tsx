import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  name: string;
  language: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserLanguage: (language: string) => Promise<void>;
}

// Create context with default values to avoid undefined errors
const defaultValues: AuthContextType = {
  user: null,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
  updateUserLanguage: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultValues);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/current", {
        credentials: "include",
      });
      
      if (res.ok) {
        const user = await res.json();
        setUser(user);
        
        // Set language based on user preference
        if (user.language && i18n.language !== user.language) {
          i18n.changeLanguage(user.language);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCurrentUser();
  }, []);
  
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await apiRequest<User>("POST", "/api/auth/login", { username, password });
      const user = res;
      
      setUser(user);
      
      // Set language based on user preference
      if (user.language && i18n.language !== user.language) {
        i18n.changeLanguage(user.language);
      }
      
      toast({
        title: t("auth.loginSuccess"),
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: t("auth.loginError"),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      
      toast({
        title: t("auth.logoutSuccess"),
        variant: "default",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateUserLanguage = async (language: string): Promise<void> => {
    if (!user) return;
    
    try {
      await apiRequest("PUT", `/api/users/${user.id}`, { language });
      setUser({ ...user, language });
      i18n.changeLanguage(language);
    } catch (error) {
      console.error("Error updating language:", error);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}

import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { SocketProvider } from "./SocketProvider";

export function SocketProviderWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Create a properly typed user object for the SocketProvider
  const socketUser = user ? {
    id: user.id,
    role: user.role
  } : null;
  
  return (
    <SocketProvider user={socketUser}>
      {children}
    </SocketProvider>
  );
}
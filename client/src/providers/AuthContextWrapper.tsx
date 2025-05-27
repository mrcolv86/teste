import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';

export function AuthContextWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/providers/AuthProvider';
import { useLocation } from 'wouter';
import { useWebSocket } from '@/lib/websocket';
import { MobileNotificationPrompt } from '@/components/notifications/MobileNotificationPrompt';
import { MobileNotificationAlert } from '@/components/notifications/MobileNotificationAlert';
import { MobilePushPermission } from '@/components/notifications/MobilePushPermission';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const { connected, authenticate } = useWebSocket();
  
  // Authenticate WebSocket connection when user is logged in
  useEffect(() => {
    if (user && connected) {
      authenticate(user.id, user.role);
      console.log('Authenticated WebSocket connection for user:', user.id);
      
      // Verificar se estamos em um dispositivo móvel
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Solicitar permissão diretamente após login para qualquer usuário em dispositivo móvel
      if (isMobileDevice && 'Notification' in window) {
        console.log('Dispositivo móvel detectado, tentando solicitar permissão para notificações...');
        
        // Pequeno delay para garantir que a interface carregue primeiro
        setTimeout(() => {
          // Verificar se já decidiu sobre as notificações
          if (Notification.permission === 'default') {
            console.log('Solicitando permissão para notificações em dispositivo móvel...');
            try {
              Notification.requestPermission().then(permission => {
                console.log('Resultado da permissão:', permission);
              });
            } catch (error) {
              console.error('Erro ao solicitar permissão:', error);
            }
          }
        }, 2000);
      }
    }
  }, [user, connected, authenticate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  const [, setLocation] = useLocation();
  
  if (!user) {
    // Use effect to avoid React state updates during render
    React.useEffect(() => {
      setLocation("/login");
    }, [setLocation]);
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <Sidebar className="hidden md:flex" />
      
      {/* Componentes de notificação móvel */}
      <MobileNotificationPrompt />
      <MobileNotificationAlert />
      <MobilePushPermission />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Navbar 
          onMenuButtonClick={() => setMobileMenuOpen(true)} 
          mobileMenuOpen={mobileMenuOpen}
          onCloseMenu={() => setMobileMenuOpen(false)}
        />

        {/* Mobile menu */}
        <MobileNav 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <div className="sm:hidden bg-white dark:bg-card border-t border-border">
          <MobileNav.BottomBar />
        </div>
      </div>
    </div>
  );
}

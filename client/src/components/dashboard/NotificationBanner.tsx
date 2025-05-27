import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { NotificationButton } from '@/components/notifications/NotificationButton';

export function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar se é um dispositivo móvel
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    
    setIsMobile(checkMobile());
    
    // Verificar o status atual das notificações
    if (checkMobile() && 'Notification' in window) {
      // Verificar se a permissão não foi concedida e não foi rejeitada
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        // Verificar se já mostramos o banner hoje
        const lastShown = localStorage.getItem('notificationBannerLastShown');
        const today = new Date().toDateString();
        
        if (!lastShown || lastShown !== today) {
          // Mostrar banner após um pequeno delay
          setTimeout(() => {
            setShowBanner(true);
          }, 3000);
        }
      }
    }
  }, []);

  // Solicitar permissão para notificações
  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Notificações não suportadas',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      console.log('Solicitando permissão para notificações do banner...');
      
      // Registrar Service Worker se necessário
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/service-worker.js');
        } catch (error) {
          console.error('Erro ao registrar Service Worker:', error);
        }
      }
      
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá alertas em tempo real.',
        });
        
        // Enviar notificação de teste
        setTimeout(() => {
          try {
            new Notification('BierServ', {
              body: 'Notificações configuradas com sucesso! Você receberá alertas em tempo real.',
              icon: '/favicon.ico'
            });
          } catch (error) {
            console.error('Erro ao enviar notificação de teste:', error);
          }
        }, 1000);
      } else {
        toast({
          title: 'Permissão negada',
          description: 'Você não receberá alertas em tempo real.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    } finally {
      // Marcar como mostrado hoje
      localStorage.setItem('notificationBannerLastShown', new Date().toDateString());
      setShowBanner(false);
    }
  };

  // Fechar o banner sem solicitar permissão
  const handleDismiss = () => {
    localStorage.setItem('notificationBannerLastShown', new Date().toDateString());
    setShowBanner(false);
  };

  if (!showBanner || !isMobile) return null;

  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm">
            Ative as notificações para receber alertas de novos pedidos e chamados
          </AlertDescription>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-7 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <NotificationButton />
        </div>
      </div>
    </Alert>
  );
}
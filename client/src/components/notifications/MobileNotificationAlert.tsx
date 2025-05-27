import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export function MobileNotificationAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Verificar se é um dispositivo móvel
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Verificar se já solicitou permissão antes
    const hasPrompted = localStorage.getItem('notificationAlertShown');

    setIsMobile(checkMobile());
    
    // Mostrar alerta apenas em dispositivos móveis e se não foi solicitado antes
    if (checkMobile() && !hasPrompted && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        // Esperar um tempo para não interromper o carregamento inicial
        const timer = setTimeout(() => {
          setShowAlert(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    try {
      console.log('Solicitando permissão para notificações (Alerta Mobile)...');
      
      // Tentar registrar o service worker primeiro
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registrado:', registration);
        } catch (err) {
          console.error('Erro ao registrar Service Worker:', err);
        }
      }

      // Solicitar permissão para notificações
      const permission = await Notification.requestPermission();
      console.log('Permissão de notificação:', permission);

      if (permission === 'granted') {
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá alertas em tempo real.',
          duration: 5000,
        });
        
        // Enviar uma notificação de teste para confirmar
        setTimeout(() => {
          try {
            new Notification('BierServ', {
              body: 'Notificações configuradas com sucesso!',
              icon: '/favicon.ico'
            });
          } catch (error) {
            console.error('Erro ao mostrar notificação:', error);
          }
        }, 500);
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
      // Marcar como mostrado
      localStorage.setItem('notificationAlertShown', 'true');
      setShowAlert(false);
    }
  };

  const dismissAlert = () => {
    localStorage.setItem('notificationAlertShown', 'true');
    setShowAlert(false);
  };

  if (!showAlert || !isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom">
      <Card className="p-4 bg-amber-50 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-800">
            <Bell className="h-4 w-4 text-amber-600 dark:text-amber-300" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium mb-1 text-sm">Ativar notificações?</h4>
            <p className="text-xs text-muted-foreground">
              Receba alertas de chamados e novos pedidos em tempo real, mesmo com o app em segundo plano.
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={dismissAlert}
              >
                Agora não
              </Button>
              
              <Button 
                className="text-xs h-7 bg-amber-600 hover:bg-amber-700"
                size="sm"
                onClick={requestPermission}
              >
                Permitir
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
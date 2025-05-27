import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá alertas mesmo com o navegador minimizado.",
        });
        
        // Test notification
        new Notification('Sistema BierServ', {
          body: 'Notificações ativadas com sucesso!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification'
        });
        
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Notificações bloqueadas",
          description: "Para receber alertas, ative as notificações nas configurações do navegador.",
          variant: "destructive",
        });
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Erro ao solicitar permissão",
        description: "Ocorreu um erro ao tentar ativar as notificações.",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options
      });
    }
    return null;
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    isGranted: permission === 'granted'
  };
}
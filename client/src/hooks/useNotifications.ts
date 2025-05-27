import { useEffect, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export function useNotifications() {
  // Request notification permission on mount
  useEffect(() => {
    console.log('useNotifications initialized');
    console.log('Notification support:', 'Notification' in window);
    console.log('Current permission:', 'Notification' in window ? Notification.permission : 'not supported');
  }, []);

  // Mobile alert fallback function
  const playMobileAlert = useCallback((title: string) => {
    console.log('🔊 Reproduzindo alerta móvel para:', title);
    
    // Strong vibration for mobile
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
      console.log('📳 Vibração ativada');
    }
    
    // Create audio alert
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const playBeep = (frequency: number, duration: number, delay: number = 0) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.8, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };
      
      // Play urgent sequence for mobile
      playBeep(1000, 0.4, 0);
      playBeep(800, 0.4, 0.5);
      playBeep(1200, 0.5, 1.0);
    } catch (error) {
      console.log('Áudio não disponível:', error);
    }
  }, []);

  const sendNotification = useCallback((options: NotificationOptions) => {
    console.log('📱 Tentando enviar notificação:', options.title);
    
    // Always trigger vibration and sound on mobile devices first
    playMobileAlert(options.title);

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('🔇 Navegador não suporta notificações - usando apenas vibração e som');
      return;
    }

    // Check permission and try to show notification
    if (Notification.permission === 'granted') {
      console.log('✅ Permissão concedida - criando notificação visual');
      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          badge: options.badge || '/favicon.ico',
          tag: options.tag || 'brewery-notification',
          requireInteraction: false, // Better for mobile
          silent: true, // We handle audio ourselves
        });

        // Auto close after 8 seconds for mobile
        setTimeout(() => {
          try {
            notification.close();
          } catch (e) {
            console.log('Notificação já foi fechada');
          }
        }, 8000);

        // Handle click events
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        console.log('🔔 Notificação visual criada com sucesso');
      } catch (error) {
        console.error('Erro ao criar notificação visual:', error);
      }
    } else {
      console.log('❌ Permissão para notificação visual negada - mantendo som e vibração');
    }
  }, [playMobileAlert]);

  const sendWaiterCallNotification = useCallback(() => {
    sendNotification({
      title: '🔔 Garçom Chamado!',
      body: 'Um cliente está chamando o garçom. Verifique qual mesa precisa de atendimento.',
      tag: 'waiter-call'
    });
  }, [sendNotification]);

  const sendNewOrderNotification = useCallback((tableNumber: number) => {
    sendNotification({
      title: '🍺 Novo Pedido!',
      body: `Novo pedido recebido da Mesa ${tableNumber}. Confirme o pedido no sistema.`,
      tag: 'new-order'
    });
  }, [sendNotification]);

  const sendOrderReadyNotification = useCallback((orderInfo: string) => {
    sendNotification({
      title: '✅ Pedido Pronto!',
      body: `Pedido ${orderInfo} está pronto para entrega.`,
      tag: 'order-ready'
    });
  }, [sendNotification]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission result:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    console.log('Notifications not supported, using sound and vibration only');
    return false;
  }, []);

  const isSupported = 'Notification' in window;
  const permission = isSupported ? Notification.permission : 'denied';

  return {
    sendNotification,
    sendWaiterCallNotification,
    sendNewOrderNotification,
    sendOrderReadyNotification,
    requestPermission,
    isSupported,
    permission,
    isGranted: permission === 'granted',
    playMobileAlert
  };
}
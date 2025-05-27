import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  // Verificar se o navegador suporta service workers e notificações push
  useEffect(() => {
    const checkSupport = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        try {
          // Importar o service worker usando Vite para construção
          const sw = new URL('/src/service-worker.ts', import.meta.url);
          
          // Registrar o service worker
          const registration = await navigator.serviceWorker.register(sw.href, { 
            scope: '/' 
          });
          
          console.log('Service Worker registrado com sucesso:', registration.scope);
          setSwRegistration(registration);
          
          // Verificar se já existe uma inscrição
          const existingSubscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!existingSubscription);
          if (existingSubscription) {
            setSubscription(existingSubscription);
            console.log('Usuário já está inscrito em notificações push');
          }
        } catch (error) {
          console.error('Erro ao registrar o service worker:', error);
        }
      } else {
        console.log('Navegador não suporta service workers ou notificações push');
        setIsSupported(false);
      }
    };
    
    checkSupport();
    
    return () => {
      // Cleanup se necessário
    };
  }, []);

  // Função para solicitar permissão e assinar notificações push
  const subscribeToPushNotifications = useCallback(async () => {
    if (!swRegistration) {
      console.error('Service Worker não está registrado');
      return false;
    }
    
    try {
      // Solicitar permissão para notificações
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações para receber alertas em seu dispositivo móvel.",
          variant: "destructive",
        });
        return false;
      }
      
      // Gerar as chaves VAPID (normalmente estas seriam fornecidas pelo servidor)
      // No ambiente de produção, estas chaves seriam geradas e armazenadas no servidor
      const applicationServerKey = urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      );
      
      // Inscrever usuário em notificações push
      const pushSubscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      
      console.log('Usuário inscrito em notificações push:', pushSubscription);
      
      // Enviar a inscrição para o servidor
      // Este é um exemplo - você deve implementar essa funcionalidade no seu servidor
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: pushSubscription,
          userId: localStorage.getItem('userId') || '',
          role: localStorage.getItem('userRole') || '',
        }),
      });
      
      if (response.ok) {
        setIsSubscribed(true);
        setSubscription(pushSubscription);
        
        toast({
          title: "Notificações push ativadas",
          description: "Você receberá alertas mesmo quando o app estiver em segundo plano ou o dispositivo bloqueado.",
        });
        
        return true;
      } else {
        console.error('Falha ao salvar inscrição no servidor');
        return false;
      }
    } catch (error) {
      console.error('Erro ao inscrever-se em notificações push:', error);
      
      toast({
        title: "Erro ao ativar notificações",
        description: "Não foi possível ativar as notificações push. Tente novamente mais tarde.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [swRegistration, toast]);

  // Função para cancelar a inscrição em notificações push
  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!swRegistration || !subscription) {
      console.error('Não é possível cancelar inscrição sem uma inscrição ativa');
      return false;
    }
    
    try {
      // Cancelar a inscrição no navegador
      const success = await subscription.unsubscribe();
      
      if (success) {
        // Notificar o servidor sobre o cancelamento
        const response = await fetch('/api/push-subscription', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: subscription,
            userId: localStorage.getItem('userId') || '',
          }),
        });
        
        if (response.ok) {
          setIsSubscribed(false);
          setSubscription(null);
          
          toast({
            title: "Notificações desativadas",
            description: "Você não receberá mais alertas em seu dispositivo.",
          });
          
          return true;
        }
      }
      
      console.error('Falha ao cancelar inscrição de notificações push');
      return false;
    } catch (error) {
      console.error('Erro ao cancelar inscrição de notificações push:', error);
      return false;
    }
  }, [swRegistration, subscription, toast]);

  // Função utilitária para converter base64 para Uint8Array (necessário para as chaves VAPID)
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
  
  return {
    isSupported,
    isSubscribed,
    subscription,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications
  };
}
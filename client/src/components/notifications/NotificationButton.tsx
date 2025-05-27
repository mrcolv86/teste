import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function NotificationButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Função que solicita permissão diretamente, sem etapas intermediárias
  const requestNotificationPermission = async () => {
    setIsLoading(true);
    
    try {
      console.log('Solicitando permissão de notificação diretamente...');
      
      // Registrar o service worker primeiro para garantir suporte a notificações push
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registrado com sucesso:', registration);
      }
      
      // Verificar suporte a notificações
      if (!('Notification' in window)) {
        toast({
          title: "Notificações não suportadas",
          description: "Seu navegador não suporta notificações push.",
          variant: "destructive",
        });
        return;
      }
      
      // Solicitação de permissão - solução mais compatível que funciona em diversos navegadores móveis
      let permissionResult;
      
      try {
        // Tentar primeiro o método moderno (Promise)
        permissionResult = await Notification.requestPermission();
      } catch (error) {
        // Fallback para método mais antigo (callback)
        permissionResult = await new Promise((resolve) => {
          Notification.requestPermission(function(result) {
            resolve(result);
          });
        });
      }
      
      console.log('Resultado da permissão:', permissionResult);
      
      if (permissionResult === 'granted') {
        // Sucesso - mostrar toast e notificação de teste
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá alertas em tempo real.",
        });
        
        // Enviar uma notificação de teste imediatamente
        setTimeout(() => {
          try {
            new Notification('BierServ - Notificações Ativadas', {
              body: 'Agora você receberá alertas em tempo real sobre novos pedidos e chamados de garçom!',
              icon: '/favicon.ico'
            });
          } catch (error) {
            console.error('Erro ao enviar notificação de teste:', error);
          }
        }, 500);
        
        // Registrar a inscrição para notificações push
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready;
            
            // Verificar se já existe uma inscrição
            const existingSubscription = await registration.pushManager.getSubscription();
            
            if (!existingSubscription) {
              // Obter a chave VAPID pública do servidor
              const response = await fetch('/api/push/vapid-public-key');
              const vapidData = await response.json();
              
              if (vapidData?.publicKey) {
                // Converter a chave para o formato correto
                const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
                
                // Criar a inscrição
                const subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: applicationServerKey
                });
                
                console.log('Inscrição push criada:', subscription);
                
                // Enviar a inscrição para o servidor
                await fetch('/api/push-subscription', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    subscription,
                    // Os IDs do usuário e função serão determinados pelo servidor através da sessão
                  }),
                });
              }
            }
          } catch (error) {
            console.error('Erro ao configurar inscrição push:', error);
          }
        }
      } else if (permissionResult === 'denied') {
        toast({
          title: "Permissão negada",
          description: "Você não receberá alertas em tempo real.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Permissão pendente",
          description: "Por favor, tente novamente mais tarde.",
        });
      }
    } catch (error) {
      console.error('Erro ao configurar notificações:', error);
      toast({
        title: "Erro nas notificações",
        description: "Não foi possível configurar as notificações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para converter string base64 para Uint8Array (necessário para chaves VAPID)
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  return (
    <Button
      onClick={requestNotificationPermission}
      disabled={isLoading}
      className="bg-amber-600 hover:bg-amber-700 text-white"
      size="sm"
    >
      <Bell className="h-4 w-4 mr-2" />
      {isLoading ? 'Ativando...' : 'Ativar Alertas'}
    </Button>
  );
}
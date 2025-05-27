import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Smartphone, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermissionRequest } from '@/hooks/usePermissionRequest';

export function MobileNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { permissionStatus, requestPermission, isMobile } = usePermissionRequest();
  const { toast } = useToast();
  
  // Verificar se devemos mostrar o prompt de notificação
  useEffect(() => {
    // Mostrar o prompt apenas em dispositivos móveis quando a permissão ainda não foi decidida
    if (isMobile && permissionStatus === 'prompt') {
      // Verificar se já mostramos o prompt antes
      const alreadyPrompted = localStorage.getItem('notificationPromptShown');
      
      if (!alreadyPrompted) {
        // Pequeno delay para garantir que a interface carregue primeiro
        setTimeout(() => setShowPrompt(true), 1500);
      }
    }
  }, [isMobile, permissionStatus]);
  
  // Solicitar permissão para notificações
  const handleRequestPermission = async () => {
    try {
      console.log('Solicitando permissão para notificações em dispositivo móvel...');
      
      // Usar o hook para solicitar permissão
      const granted = await requestPermission();
      
      if (granted) {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá alertas mesmo com o app em segundo plano.",
        });
        
        // Registrar service worker se ainda não estiver registrado
        if ('serviceWorker' in navigator) {
          try {
            // Registrar o service worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registrado com sucesso:', registration);
            
            // Tentar criar uma inscrição push
            if ('PushManager' in window) {
              try {
                // Verificar se já existe uma assinatura
                const subscription = await registration.pushManager.getSubscription();
                
                if (!subscription) {
                  // Obter a chave VAPID do servidor
                  const vapidPublicKey = await getVapidPublicKey();
                  
                  if (vapidPublicKey) {
                    // Inscrever para notificações push
                    await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: vapidPublicKey
                    });
                    console.log('Inscrição para notificações push criada com sucesso');
                    
                    // Enviar uma notificação de teste
                    setTimeout(() => {
                      try {
                        new Notification('BierServ', {
                          body: 'Notificações configuradas com sucesso! Você receberá alertas em tempo real.',
                          icon: '/favicon.ico'
                        });
                      } catch (notifyError) {
                        console.error('Erro ao enviar notificação de teste:', notifyError);
                      }
                    }, 1000);
                  }
                }
              } catch (pushError) {
                console.error('Erro ao configurar inscrição push:', pushError);
              }
            }
          } catch (swError) {
            console.error('Erro ao registrar Service Worker:', swError);
          }
        }
      } else {
        // Permissão negada
        toast({
          title: "Permissão negada",
          description: "Você não receberá notificações em segundo plano.",
          variant: "destructive",
        });
      }
      
      // Marcar como já solicitado
      localStorage.setItem('notificationPromptShown', 'true');
      setShowPrompt(false);
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast({
        title: "Erro ao solicitar permissão",
        description: "Ocorreu um erro ao configurar as notificações.",
        variant: "destructive",
      });
    }
  };
  
  // Função para obter a chave pública VAPID do servidor
  const getVapidPublicKey = async (): Promise<Uint8Array | null> => {
    try {
      const response = await fetch('/api/push/vapid-public-key');
      const data = await response.json();
      
      if (data && data.publicKey) {
        return urlBase64ToUint8Array(data.publicKey);
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter chave VAPID:', error);
      return null;
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
  };
  
  // Fechar o prompt sem solicitar permissão
  const dismissPrompt = () => {
    localStorage.setItem('notificationPromptShown', 'true');
    setShowPrompt(false);
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-amber-500" />
            Ativar Notificações
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={dismissPrompt} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            O BierServ precisa enviar notificações para que você receba alertas de chamados de garçom e pedidos, mesmo quando o app estiver em segundo plano.
          </p>
          
          <div className="bg-amber-50 p-3 rounded border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <BellRing className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium">Notificações em tempo real</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Você receberá alertas instantâneos sobre chamados de garçom, novos pedidos e outras atividades importantes, mesmo com o dispositivo bloqueado.
            </p>
          </div>
          
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={dismissPrompt}
            >
              Agora não
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleRequestPermission}
            >
              <Bell className="h-4 w-4 mr-2" />
              Permitir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BellRing, Info, Check, Smartphone, Bell, Vibrate, SmartphoneCharging } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/providers/AuthProvider";

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Verificar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

  // Verificar suporte do navegador
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
      
      // Mostrar modal de permissão automaticamente em dispositivos móveis
      // se não tiver permissão já concedida
      if (isMobile && Notification.permission !== 'granted') {
        setShowPermissionModal(true);
      }
    } else {
      console.log('Navegador não suporta notificações push');
      setIsSupported(false);
    }
  }, [isMobile]);

  // Registrar o service worker
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registrado com sucesso:', registration);
      setSwRegistration(registration);
      
      // Verificar se já existe uma inscrição
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      
      if (subscription) {
        console.log('Usuário já está inscrito em notificações push');
      }
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
    }
  };

  // Obter chave pública para notificações push
  const getVapidPublicKey = async () => {
    try {
      const response = await fetch('/api/push/vapid-public-key');
      const data = await response.json();
      return urlBase64ToUint8Array(data.publicKey);
    } catch (error) {
      console.error('Erro ao obter chave VAPID:', error);
      return null;
    }
  };

  // Converter a chave pública do formato Base64 para Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  // Inscrever-se para notificações push
  const subscribeToPushNotifications = async () => {
    if (!swRegistration) {
      console.error('Service Worker não está registrado');
      return;
    }
    
    try {
      setIsRegistering(true);
      
      // Solicitar permissão para notificações de forma compatível com diferentes dispositivos e navegadores
      console.log('Solicitando permissão para notificações...');
      
      let permissionResult;
      
      if (typeof Notification.requestPermission === 'function') {
        if (Notification.requestPermission.length === 0) {
          // Implementação moderna baseada em Promise (maioria dos navegadores atuais)
          permissionResult = await Notification.requestPermission();
          console.log('Resultado da permissão (Promise):', permissionResult);
        } else {
          // Implementação mais antiga baseada em callback (alguns navegadores móveis)
          permissionResult = await new Promise((resolve) => {
            Notification.requestPermission((result) => {
              resolve(result);
            });
          });
          console.log('Resultado da permissão (Callback):', permissionResult);
        }
      } else {
        // Fallback para casos extremamente raros
        permissionResult = Notification.permission;
        console.log('Permissão atual (sem solicitar):', permissionResult);
      }
      
      if (permissionResult !== 'granted') {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações para receber alertas.",
          variant: "destructive",
        });
        setIsRegistering(false);
        return;
      }
      
      // Testar notificação básica para confirmar que as permissões funcionam
      if (isMobile) {
        try {
          new Notification('BierServ', {
            body: 'Testando permissões de notificação',
            icon: '/favicon.ico'
          });
        } catch (notifyError) {
          console.error('Erro ao enviar notificação de teste:', notifyError);
        }
      }
      
      // Obter a chave pública
      const applicationServerKey = await getVapidPublicKey();
      if (!applicationServerKey) {
        toast({
          title: "Erro na configuração",
          description: "Não foi possível obter as chaves necessárias.",
          variant: "destructive",
        });
        setIsRegistering(false);
        return;
      }
      
      console.log('Tentando inscrever para push manager...');
      
      // Inscrever-se para notificações push
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      
      console.log('Inscrição criada:', subscription);
      
      // Enviar a inscrição para o servidor
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: user?.id,
          role: user?.role
        }),
      });
      
      if (response.ok) {
        setIsSubscribed(true);
        toast({
          title: "Notificações ativadas",
          description: "Você receberá alertas mesmo quando o app estiver em segundo plano.",
        });
        
        // Em dispositivos móveis, mostrar uma confirmação extra
        if (isMobile) {
          setTimeout(() => {
            new Notification('BierServ - Notificações Ativadas', {
              body: 'Você receberá alertas em tempo real sobre novos pedidos e chamados de garçom.',
              icon: '/favicon.ico'
              // A propriedade vibrate é manipulada pelo Service Worker, não pelo objeto Notification
            });
          }, 1000);
        }
      } else {
        console.error('Falha ao salvar inscrição no servidor');
        toast({
          title: "Erro ao ativar notificações",
          description: "Não foi possível completar o registro. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao inscrever-se para notificações push:', error);
      toast({
        title: "Erro no registro",
        description: "Ocorreu um erro ao registrar as notificações push.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Cancelar inscrição de notificações push
  const unsubscribeFromPushNotifications = async () => {
    if (!swRegistration) {
      return;
    }
    
    try {
      setIsRegistering(true);
      
      // Obter a inscrição atual
      const subscription = await swRegistration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        setIsRegistering(false);
        return;
      }
      
      // Cancelar a inscrição
      const success = await subscription.unsubscribe();
      
      if (success) {
        // Notificar o servidor
        const response = await fetch('/api/push-subscription', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
          }),
        });
        
        if (response.ok) {
          setIsSubscribed(false);
          toast({
            title: "Notificações desativadas",
            description: "Você não receberá mais alertas no dispositivo.",
          });
        }
      } else {
        toast({
          title: "Erro ao desativar",
          description: "Não foi possível cancelar as notificações.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      toast({
        title: "Erro ao desativar",
        description: "Ocorreu um erro ao cancelar as notificações.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Testar notificação push (apenas para desenvolvimento)
  const testPushNotification = async () => {
    if (!isSubscribed) {
      toast({
        title: "Notificações não ativadas",
        description: "Ative as notificações primeiro.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/push/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Teste de Notificação',
          body: 'Esta é uma notificação de teste. Se você está vendo isto, as notificações push estão funcionando!',
          target: 'all'
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Notificação enviada",
          description: "Você deve receber uma notificação de teste em breve.",
        });
      } else {
        toast({
          title: "Erro no teste",
          description: "Não foi possível enviar a notificação de teste.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao testar notificação:', error);
      toast({
        title: "Erro no teste",
        description: "Ocorreu um erro ao enviar a notificação de teste.",
        variant: "destructive",
      });
    }
  };

  // Modal de permissão para dispositivos móveis
  const PermissionModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-amber-500" />
            Permitir Notificações?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Para receber alertas de chamados de garçom e novos pedidos mesmo quando o aplicativo estiver em segundo plano, precisamos da sua permissão.
          </p>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 bg-amber-50 p-2 rounded border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <BellRing className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm">Seja notificado imediatamente sobre novos chamados</p>
            </div>
            
            <div className="flex items-center gap-2 bg-amber-50 p-2 rounded border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <Vibrate className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm">Receba alertas vibrantes para ações urgentes</p>
            </div>
          </div>
        </CardContent>
        <div className="p-4 pt-0 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setShowPermissionModal(false)}
          >
            Mais tarde
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => {
              setShowPermissionModal(false);
              subscribeToPushNotifications();
            }}
          >
            Permitir Notificações
          </Button>
        </div>
      </Card>
    </div>
  );

  if (!isSupported) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Info className="h-5 w-5" />
            Notificações Push Não Suportadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Seu navegador não suporta notificações push. Para receber alertas quando o aplicativo estiver em segundo plano, tente usar um navegador mais recente como Chrome, Firefox ou Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showPermissionModal && <PermissionModal />}
      
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Notificações em Dispositivos Móveis
            </div>
            {isSubscribed ? (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <Check className="h-3 w-3 mr-1" />
                Ativadas
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Bell className="h-3 w-3 mr-1" />
                Desativadas
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Receba alertas de chamados de garçom e novos pedidos mesmo quando o app estiver em segundo plano ou o dispositivo bloqueado.
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={isSubscribed ? unsubscribeFromPushNotifications : () => isMobile ? setShowPermissionModal(true) : subscribeToPushNotifications()}
                disabled={isRegistering}
              />
              <label
                htmlFor="push-notifications"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {isSubscribed ? "Desativar Notificações" : "Ativar Notificações"}
              </label>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={testPushNotification}
                    disabled={!isSubscribed || isRegistering}
                  >
                    <BellRing className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enviar notificação de teste</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Compatível com dispositivos Android e desktops. iOS possui suporte limitado.</p>
          </div>
          
          {isMobile && !isSubscribed && (
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 mt-2"
              onClick={() => setShowPermissionModal(true)}
              disabled={isRegistering}
            >
              <Bell className="h-4 w-4 mr-2" />
              Configurar Notificações no Dispositivo
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
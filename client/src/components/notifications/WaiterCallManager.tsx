import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { Bell, BellRing, Check, Settings, Smartphone, Vibrate } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';

interface WaiterCall {
  id: number;
  tableId: number;
  tableNumber: number;
  timestamp: Date;
  message: string;
}

interface WaiterCallManagerProps {
  waiterCalls: WaiterCall[];
  onCallAccepted: (callId: number) => void;
}

export function WaiterCallManager({ waiterCalls, onCallAccepted }: WaiterCallManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { permission, isSupported, requestPermission, sendNotification, isGranted } = useNotificationPermission();
  const { showMobileAlert } = useMobileNotifications();
  const [showPermissionCard, setShowPermissionCard] = useState(false);

  useEffect(() => {
    // Show permission card if notifications are not granted
    if (isSupported && permission !== 'granted') {
      setShowPermissionCard(true);
    }
  }, [isSupported, permission]);

  // Accept waiter call mutation
  const acceptCallMutation = useMutation({
    mutationFn: async (call: { tableId: number; tableNumber: number }) => {
      const response = await fetch(`/api/waiter-calls/${call.tableId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Erro ao aceitar chamado');
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        // If not JSON, return success status
        return { success: true, message: 'Chamado aceito com sucesso' };
      }
    },
    onSuccess: (_, call) => {
      toast({
        title: "Chamado aceito!",
        description: `Chamado da Mesa ${call.tableNumber} foi atendido.`,
      });
      onCallAccepted(call.tableId);
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aceitar chamado",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleAcceptCall = (call: WaiterCall) => {
    acceptCallMutation.mutate({ tableId: call.tableId, tableNumber: call.tableNumber });
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPermissionCard(false);
    }
  };

  if (waiterCalls.length === 0 && !showPermissionCard) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Notification Permission Card */}
      {showPermissionCard && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Smartphone className="h-5 w-5" />
              Ativar Notificações Push
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Ative as notificações para receber alertas de chamados de garçom mesmo com o navegador minimizado ou celular bloqueado.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleRequestPermission}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                size="sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                Ativar Notificações
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPermissionCard(false)}
                size="sm"
              >
                Agora não
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Status */}
      {isSupported && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status das Notificações</span>
              </div>
              <div className="flex items-center gap-2">
                {isGranted ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <BellRing className="h-3 w-3 mr-1" />
                    Ativadas
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Bell className="h-3 w-3 mr-1" />
                    Desativadas
                  </Badge>
                )}
                {!isGranted && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRequestPermission}
                  >
                    Ativar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiter Calls */}
      {waiterCalls.map((call) => (
        <Card key={call.id} className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <BellRing className="h-5 w-5 animate-pulse" />
                Chamado de Garçom
              </div>
              <Badge variant="destructive" className="animate-pulse">
                Mesa {call.tableNumber}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {call.message}
            </p>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {new Date(call.timestamp).toLocaleTimeString('pt-BR')}
            </div>
            <Button 
              onClick={() => handleAcceptCall(call)}
              disabled={acceptCallMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {acceptCallMutation.isPending ? 'Aceitando...' : 'Aceitar Chamado'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
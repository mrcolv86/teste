import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, Clock, CheckCircle, XCircle, Utensils, Bell } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useSimpleWebSocket } from '@/hooks/useSimpleWebSocket';
import { AlertNotification } from '@/components/ui/alert-notification';
import { WaiterCallCard } from '@/components/orders/WaiterCallCard';
import { WaiterCallManager } from '@/components/notifications/WaiterCallManager';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export default function Orders() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendNotification, isGranted } = useNotificationPermission();
  
  // Check if user can see financial information (only managers and admins)
  const canSeeFinancials = user && (user.role === 'admin' || user.role === 'manager');
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'order' | 'waiter_request' | 'promotion';
    isVisible: boolean;
  } | null>(null);
  
  const [waiterCalls, setWaiterCalls] = useState<Array<{
    id: number;
    tableId: number;
    tableNumber: number;
    timestamp: Date;
    message: string;
  }>>([]);

  // WebSocket connection for real-time updates
  const { connected } = useSimpleWebSocket();
  
  // Mobile notifications for waiters
  const { showMobileAlert } = useMobileNotifications();

  useEffect(() => {
    let socket: WebSocket | null = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('Orders WebSocket connected');
        // Authenticate as admin to receive order updates
        socket?.send(JSON.stringify({ type: 'AUTH', userId: 1, role: 'admin' }));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received in Orders:', data);
          
          if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATED') {
            console.log('Refreshing orders due to:', data.type);
            
            // Show alert for new orders
            if (data.type === 'NEW_ORDER') {
              const tableNumber = data.data?.table?.number || data.data?.tableId;
              setNotification({
                message: `Novo pedido da Mesa ${tableNumber || ''}!`,
                type: 'order',
                isVisible: true
              });
              
              // Send mobile notification for new order (only for staff)
              if (user && (user.role === 'admin' || user.role === 'manager' || user.role === 'waiter') && tableNumber && data.data?.id) {
                showMobileAlert('🍺 Novo Pedido!', `Novo pedido recebido da Mesa ${tableNumber}`);
              }
            }
            
            if (data.type === 'ORDER_UPDATED' && data.data?.id) {
              // Immediately update the order in cache for instant UI update
              queryClient.setQueryData(['/api/orders'], (old: any) => {
                if (!old) return old;
                return old.map((order: any) => 
                  order.id === data.data.id 
                    ? { ...order, ...data.data }
                    : order
                );
              });
              
              // Send mobile notification for order ready (only for staff)
              if (user && (user.role === 'admin' || user.role === 'manager' || user.role === 'waiter') && data.data.status === 'ready') {
                const tableNumber = data.data.table?.number || data.data.tableId;
                if (tableNumber && data.data.id) {
                  showMobileAlert('✅ Pedido Pronto!', `Pedido #${data.data.id} - Mesa ${tableNumber} está pronto`);
                }
              }
            }
            
            // Force immediate refetch to ensure UI updates
            refetchOrders();
            
            // Also invalidate queries to ensure data consistency
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            if (data.data?.id) {
              queryClient.invalidateQueries({ queryKey: [`/api/orders/${data.data.id}`] });
              queryClient.invalidateQueries({ queryKey: [`/api/orders/${data.data.id}/items`] });
            }
          }
          
          // Handle waiter calls
          if (data.type === 'WAITER_CALLED') {
            const newCall = {
              id: Date.now(),
              tableId: data.data?.tableId || 0,
              tableNumber: data.data?.tableNumber || 0,
              timestamp: new Date(),
              message: `Chamado da Mesa ${data.data?.tableNumber}`
            };
            
            setWaiterCalls(prev => [newCall, ...prev.slice(0, 4)]); // Keep only 5 most recent calls
            
            // Send push notification if granted
            if (isGranted) {
              sendNotification(
                'Chamado de Garçom',
                `Mesa ${data.data?.tableNumber} está solicitando atendimento`
              );
            }
            
            setNotification({
              message: `🔔 Garçom chamado na Mesa ${data.data?.tableNumber || ''} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
              type: 'waiter_request',
              isVisible: true
            });
            
            // Send mobile notification for waiter call (only for staff)
            if (user && (user.role === 'admin' || user.role === 'manager' || user.role === 'waiter') && data.data?.tableNumber) {
              showMobileAlert('🔔 Garçom Chamado!', `Cliente na Mesa ${data.data.tableNumber} está chamando`);
            }
          }
          
          // Handle delivery ready alerts
          if (data.type === 'DELIVERY_READY') {
            setNotification({
              message: data.data?.message || `Pedido pronto para entrega - Mesa ${data.data?.tableNumber || ''}!`,
              type: 'order',
              isVisible: true
            });
          }
          
          if (data.type === 'TABLE_UPDATED' || data.type === 'ORDER_UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('Orders WebSocket disconnected');
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      socket.onerror = (error) => {
        console.error('Orders WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Função para aceitar chamados de garçom
  const handleCallAccepted = (tableId: number) => {
    setWaiterCalls(prev => prev.filter(call => call.tableId !== tableId));
  };
  
  // Fetch orders with refetch interval to ensure updates
  const { data: orders = [], isLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/orders'],
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refetch every 5 seconds as backup
  });

  // Fetch tables
  const { data: tables = [] } = useQuery({
    queryKey: ['/api/tables'],
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest('PUT', `/api/orders/${orderId}`, { status });
    },
    onMutate: async ({ orderId, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['/api/orders'] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData(['/api/orders']);

      // Optimistically update to the new value
      queryClient.setQueryData(['/api/orders'], (old: any) => {
        if (!old) return old;
        return old.map((order: any) => 
          order.id === orderId 
            ? { ...order, status, updatedAt: new Date().toISOString() }
            : order
        );
      });

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrders) {
        queryClient.setQueryData(['/api/orders'], context.previousOrders);
      }
      
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do pedido',
        variant: 'destructive',
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Pedido atualizado',
        description: 'Status do pedido foi alterado com sucesso',
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
    }
  });

  // Filter orders
  const filteredOrders = (orders as any[]).filter((order: any) => {
    const matchesSearch = !searchTerm || 
      order.id.toString().includes(searchTerm) ||
      order.tableNumber?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesTable = !selectedTableId || order.tableId === selectedTableId;
    
    return matchesSearch && matchesStatus && matchesTable;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800 border-red-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'preparing': return 'Preparando';
      case 'delivered': return 'Entregue';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />;
      case 'preparing': return <Utensils className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTableNumber = (tableId: number) => {
    const table = (tables as any[]).find(t => t.id === tableId);
    return table ? table.number : tableId;
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus });
  };

  const dismissWaiterCall = (callId: string) => {
    setWaiterCalls(prev => prev.filter(call => call.id !== callId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie todos os pedidos do estabelecimento
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
          {/* Notification Permission Section */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={async () => {
                console.log('Botão de notificação clicado!');
                
                // Test mobile alert system
                showMobileAlert('🔔 Teste de Alerta!', 'Sistema funcionando perfeitamente para celulares!');
                
                // Always show success message for mobile devices
                setTimeout(() => {
                  alert('✅ Alertas ativados! Você receberá vibração e som em todos os pedidos importantes, mesmo sem permissão de notificação.');
                }, 1000);
              }}
              variant="outline"
              size="sm"
              className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <Bell className="h-4 w-4 mr-2" />
              {('Notification' in window && Notification.permission === 'granted') ? 'Alertas Ativos' : 'Ativar Alertas'}
            </Button>
            
            {/* Mobile instructions */}
            <div className="text-xs text-gray-600 dark:text-gray-400 max-w-48 sm:hidden">
              📱 Para garçons: ative as notificações para receber alertas mesmo com o celular bloqueado
            </div>
          </div>
          
          <Button 
            className="bg-amber hover:bg-amber/90" 
            onClick={() => setLocation('/menu')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar por número do pedido ou mesa..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
            <SelectItem value="completed">Finalizados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedTableId?.toString() || ''} onValueChange={(value) => setSelectedTableId(value ? parseInt(value) : null)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por mesa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Todas as mesas</SelectItem>
            {(tables as any[]).map((table: any) => (
              <SelectItem key={table.id} value={table.id.toString()}>
                Mesa {table.number.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Waiter Call Manager */}
      <WaiterCallManager 
        waiterCalls={waiterCalls}
        onCallAccepted={handleCallAccepted}
      />
      
      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order: any) => (
            <Card 
              key={order.id} 
              className="flex flex-col h-fit"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Pedido #{order.id.toString().padStart(4, '0')}</CardTitle>
                    <CardDescription>Mesa {getTableNumber(order.tableId).toString().padStart(2, '0')}</CardDescription>
                    <div className="text-xs text-muted-foreground mt-1">
                      🕐 {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusText(order.status)}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 pt-0">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Itens:</h4>
                    <div className="space-y-1.5 text-sm max-h-32 overflow-y-auto">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-start p-2 bg-muted/50 rounded text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">{item.quantity}x {item.name || item.productName || 'Item'}</div>
                              {item.notes && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                                  💬 {item.notes}
                                </div>
                              )}
                            </div>
                            {canSeeFinancials && (
                              <span className="font-medium text-foreground ml-2 text-xs flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2 text-gray-500 text-xs">
                          <div className="text-lg mb-1">📝</div>
                          <span>Sem itens</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {canSeeFinancials && (
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <div className="p-4 pt-0">
                <div className="flex gap-1.5 w-full">
                  {order.status === 'new' && (
                    <Button
                      size="sm"
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-xs h-8"
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                      disabled={updateOrderMutation.isPending}
                    >
                      Preparar
                    </Button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs h-8"
                      onClick={() => handleStatusChange(order.id, 'delivered')}
                      disabled={updateOrderMutation.isPending}
                    >
                      Entregar
                    </Button>
                  )}
                  
                  {order.status === 'delivered' && (
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                      onClick={() => handleStatusChange(order.id, 'completed')}
                      disabled={updateOrderMutation.isPending}
                    >
                      Finalizar
                    </Button>
                  )}

                  {(order.status === 'new' || order.status === 'preparing') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 px-2"
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      disabled={updateOrderMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || selectedTableId 
                ? 'Tente ajustar os filtros de busca' 
                : 'Ainda não há pedidos no sistema'}
            </p>
            <Button 
              onClick={() => setLocation('/menu')}
              className="bg-amber hover:bg-amber/90"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Primeiro Pedido
            </Button>
          </div>
        </div>
      )}

      {/* Alert Notification */}
      {notification && (
        <AlertNotification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
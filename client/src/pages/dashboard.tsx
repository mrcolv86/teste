import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Beer, Download, Plus, Receipt, ShoppingBag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { TableStatus } from '@/components/dashboard/TableStatus';
import { MenuCategory } from '@/components/menu/MenuCategory';
import { QRCodeDisplay } from '@/components/tables/QRCodeDisplay';
import { WaiterCallManager } from '@/components/notifications/WaiterCallManager';
import { NotificationBanner } from '@/components/dashboard/NotificationBanner';
import BigAlert from '@/components/ui/big-alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useWebSocket } from '@/lib/websocket';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { addMessageHandler, removeMessageHandler } = useWebSocket();
  const { sendNotification, isGranted } = useNotificationPermission();
  
  // Estado para notificações chamativas
  const [notification, setNotification] = useState<{
    message: string;
    type: 'order' | 'waiter_request' | 'promotion';
    isVisible: boolean;
    title?: string;
    details?: string;
    timestamp?: Date;
  } | null>(null);

  // Estado para chamados de garçom
  const [waiterCalls, setWaiterCalls] = useState<{
    id: number;
    tableId: number;
    tableNumber: number;
    timestamp: Date;
    message: string;
  }[]>([]);

  // Fetch brewery settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Fetch tables for stats
  const { data: tables = [] } = useQuery({
    queryKey: ['/api/tables'],
  });

  // Fetch orders for stats
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Listen for real-time updates
  useEffect(() => {
    const handleNewOrder = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      
      // Mostrar alerta super chamativo para novo pedido
      setNotification({
        message: `Mesa ${data.data?.tableId || ''} fez um novo pedido!`,
        type: 'order',
        isVisible: true,
        title: '🚨 NOVO PEDIDO RECEBIDO!',
        details: `Valor total: R$ ${data.data?.totalAmount?.toFixed(2) || '0,00'} - Verifique os detalhes no sistema`,
        timestamp: new Date()
      });
    };

    const handleOrderUpdate = (data: any) => {
      console.log('Dashboard: Order updated', data);
      // Invalidate all order-related queries for instant updates
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (data.data?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${data.data.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${data.data.id}/items`] });
      }
    };

    const handleTableUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
    };

    const handleTableCreated = (data: any) => {
      console.log('Dashboard: New table created', data);
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      
      // Mostrar notificação discreta para nova mesa
      setNotification({
        message: `Nova mesa ${data.data?.number || ''} criada!`,
        type: 'promotion',
        isVisible: true
      });
    };

    const handleWaiterCall = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      // Adicionar chamado à lista
      const newCall = {
        id: Date.now(), // Temporary ID
        tableId: data.data?.tableId || 0,
        tableNumber: data.data?.tableNumber || 0,
        timestamp: new Date(),
        message: `Mesa ${data.data?.tableNumber || ''} está solicitando atendimento`
      };
      
      setWaiterCalls(prev => [...prev, newCall]);
      
      // Enviar notificação push se permitido
      if (isGranted && sendNotification) {
        sendNotification('🔔 Chamado de Garçom', {
          body: `Mesa ${data.data?.tableNumber || ''} está solicitando atendimento`,
          requireInteraction: true,
          tag: `waiter-call-${data.data?.tableId}`,
          data: { tableId: data.data?.tableId, tableNumber: data.data?.tableNumber }
        });
      }
      
      // Mostrar alerta super chamativo para chamado de garçom
      setNotification({
        message: `Mesa ${data.data?.tableNumber || ''} está chamando o garçom!`,
        type: 'waiter_request',
        isVisible: true,
        title: '🔔 GARÇOM SOLICITADO!',
        details: `Um cliente precisa de atendimento - Dirija-se à mesa para verificar o que precisam`,
        timestamp: new Date()
      });
    };

    const handleDeliveryReady = (data: any) => {
      // Mostrar alerta super chamativo para pedido pronto para entrega
      setNotification({
        message: data.data?.message || `Pedido pronto para entrega - Mesa ${data.data?.tableNumber || ''}!`,
        type: 'order',
        isVisible: true
      });
    };

    // Add message handlers
    addMessageHandler('NEW_ORDER', handleNewOrder);
    addMessageHandler('ORDER_UPDATED', handleOrderUpdate);
    addMessageHandler('TABLE_UPDATED', handleTableUpdate);
    addMessageHandler('TABLE_CREATED', handleTableCreated);
    addMessageHandler('WAITER_CALLED', handleWaiterCall);
    addMessageHandler('DELIVERY_READY', handleDeliveryReady);
    addMessageHandler('NEW_NOTIFICATION', handleWaiterCall);

    return () => {
      removeMessageHandler('NEW_ORDER', handleNewOrder);
      removeMessageHandler('ORDER_UPDATED', handleOrderUpdate);
      removeMessageHandler('TABLE_UPDATED', handleTableUpdate);
      removeMessageHandler('WAITER_CALLED', handleWaiterCall);
      removeMessageHandler('DELIVERY_READY', handleDeliveryReady);
      removeMessageHandler('NEW_NOTIFICATION', handleWaiterCall);
    };
  }, [queryClient, addMessageHandler, removeMessageHandler]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  const beerCategory = categories.find((c: any) => c.name.toLowerCase().includes('cerveja'));
  const beerProducts = products.filter((p: any) => 
    beerCategory ? p.categoryId === beerCategory.id : false
  );

  // Calculate stats
  const beersSold = orders.reduce((acc: number, order: any) => {
    const beerItems = (order.items || []).filter((item: any) => 
      beerCategory ? item.productId && beerProducts.some(p => p.id === item.productId) : false
    );
    return acc + beerItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  }, 0);

  const dishesSold = orders.reduce((acc: number, order: any) => {
    const nonBeerItems = (order.items || []).filter((item: any) => 
      beerCategory ? item.productId && !beerProducts.some(p => p.id === item.productId) : true
    );
    return acc + nonBeerItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  }, 0);

  const occupiedTables = tables.filter((t: any) => t.status === 'occupied').length;
  const totalTables = tables.length;

  const totalRevenue = orders.reduce((acc: number, order: any) => acc + (order.totalAmount || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Função para aceitar chamados de garçom
  const handleCallAccepted = (tableId: number) => {
    setWaiterCalls(prev => prev.filter(call => call.tableId !== tableId));
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            {t('common.dashboard')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {settings?.name ? `${t('dashboard.welcomeMessage')} ${settings.name}` : t('dashboard.welcomeMessage')}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3 animate-slide-in-right">
          <Button 
            onClick={() => setLocation('/orders')}
            className="btn-interactive inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-amber hover:bg-amber/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.newOrder')}
          </Button>
          <Button 
            variant="outline"
            className="btn-interactive inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('dashboard.export')}
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Beer className="text-amber text-xl" />}
          iconBackground="bg-amber/10"
          title={t('dashboard.beersSold')}
          value={beersSold}
          footerText={t('dashboard.viewAll')}
          footerLink="/reports"
          onClick={() => setLocation('/reports')}
        />
        
        <StatCard
          icon={<ShoppingBag className="text-green-600 dark:text-green-400 text-xl" />}
          iconBackground="bg-green-100 dark:bg-green-900/30"
          title={t('dashboard.dishSold')}
          value={dishesSold}
          footerText={t('dashboard.viewAll')}
          footerLink="/reports"
          onClick={() => setLocation('/reports')}
        />
        
        <StatCard
          icon={<Users className="text-blue-600 dark:text-blue-400 text-xl" />}
          iconBackground="bg-blue-100 dark:bg-blue-900/30"
          title={t('dashboard.tablesOccupied')}
          value={`${occupiedTables} / ${totalTables}`}
          footerText={t('dashboard.viewAll')}
          footerLink="/tables"
          onClick={() => setLocation('/tables')}
        />
        
        <StatCard
          icon={<Receipt className="text-purple-600 dark:text-purple-400 text-xl" />}
          iconBackground="bg-purple-100 dark:bg-purple-900/30"
          title={t('dashboard.revenue')}
          value={formatCurrency(totalRevenue)}
          footerText={t('dashboard.viewAll')}
          footerLink="/reports"
          onClick={() => setLocation('/reports')}
        />
      </div>
      
      {/* Notification Banner para dispositivos móveis */}
      <NotificationBanner />
      
      {/* Waiter Call Manager */}
      <WaiterCallManager 
        waiterCalls={waiterCalls}
        onCallAccepted={handleCallAccepted}
      />
      
      {/* Recent Orders & Table Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOrders />
        <TableStatus />
      </div>
      
      {/* Digital Menu Preview */}
      <div className="bg-card border border-border shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-foreground">
              {t('dashboard.digitalMenu')}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t('dashboard.menuPreview')}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/menu">
              <Button variant="link" className="text-amber hover:text-amber/80">
                {t('menu.manageMenu')}
              </Button>
            </Link>
          </div>
        </div>
        <div className="border-t border-border px-4 py-5 sm:p-6">
          {categories.length > 0 && products.length > 0 ? (
            <MenuCategory 
              category={beerCategory || categories[0]} 
              products={beerProducts.length > 0 ? beerProducts.slice(0, 3) : products.slice(0, 3)} 
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </div>
        <div className="bg-accent/10 px-4 py-4 sm:px-6 text-right border-t border-border">
          <Link href="/menu" className="text-sm font-medium text-amber hover:text-amber/80">
            Gerenciar Cardápio
          </Link>
        </div>
      </div>
      
      {/* QR Codes Section */}
      <div className="bg-card border border-border shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-foreground">
            {t('dashboard.qrCodes')}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t('dashboard.qrAccess')}
          </p>
        </div>
        <div className="border-t border-border px-4 py-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.slice(0, 6).map((table: any) => (
              <QRCodeDisplay key={table.id} table={table} />
            ))}
          </div>
        </div>
        <div className="bg-accent/10 px-4 py-4 sm:px-6 text-right border-t border-border">
          <Link href="/tables" className="text-sm font-medium text-amber hover:text-amber/80">
            Visualizar Todos
          </Link>
        </div>
      </div>
      
      {/* Alerta super chamativo para notificações */}
      {notification && (
        <BigAlert
          message={notification.message}
          type={notification.type}
          title={notification.title}
          details={notification.details}
          timestamp={notification.timestamp}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

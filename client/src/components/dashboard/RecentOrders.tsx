import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { useWebSocket } from '@/lib/websocket';

export function RecentOrders() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addMessageHandler, removeMessageHandler } = useWebSocket();
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders?limit=4'],
  });

  // Listen for real-time updates
  useEffect(() => {
    const handleNewOrder = () => {
      console.log('New order received, refreshing orders...');
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    };

    const handleOrderUpdate = (data: any) => {
      console.log('Order updated, refreshing orders...', data);
      // Invalidate all order-related queries for instant updates
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (data.data?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${data.data.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${data.data.id}/items`] });
      }
    };

    // Add message handlers
    addMessageHandler('NEW_ORDER', handleNewOrder);
    addMessageHandler('ORDER_UPDATED', handleOrderUpdate);

    return () => {
      removeMessageHandler('NEW_ORDER', handleNewOrder);
      removeMessageHandler('ORDER_UPDATED', handleOrderUpdate);
    };
  }, [queryClient, addMessageHandler, removeMessageHandler]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'preparing':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'delivered':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatOrderItems = (items: any[]) => {
    if (!items || items.length === 0) return '';

    return items.map(item => `${item.quantity} × ${item.name || 'Item'}`).join(', ');
  };

  return (
    <Card className="bg-card border border-border shadow rounded-lg">
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-start">
        <div>
          <CardTitle className="text-lg leading-6 font-medium text-foreground">
            {t('dashboard.recentOrders')}
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t('dashboard.latestOrders')}
          </CardDescription>
        </div>
        <Badge variant="outline" className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
          {t('dashboard.realtimeUpdates')}
        </Badge>
      </CardHeader>
      <div className="border-t border-border">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('orders.table')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('orders.items')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('orders.total')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('orders.status')}</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-12" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20" />
                    </td>
                  </tr>
                ))
              ) : (
                (orders || []).map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {t('tables.tableNumber')} {order.tableId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatOrderItems(order.items)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusBadgeClass(order.status)}>
                        {t(`orders.${order.status}`)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-accent/10 px-4 py-4 sm:px-6 text-right border-t border-border">
        <Link to="/orders" className="text-sm font-medium text-amber hover:text-amber/80">
          {t('dashboard.viewAll')}
        </Link>
      </div>
    </Card>
  );
}

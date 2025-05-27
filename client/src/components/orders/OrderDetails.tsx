import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDateTime, formatCurrency } from '@/utils/format';
import { useAuth } from '@/providers/AuthProvider';
// import { useSocket } from '@/providers/SocketProvider';

interface OrderDetailsProps {
  orderId: number;
  onStatusChange?: () => void;
  canEdit?: boolean;
}

export function OrderDetails({ 
  orderId,
  onStatusChange,
  canEdit = false
}: OrderDetailsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  // const { sendMessage } = useSocket();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Check if user can see financial information (only managers and admins)
  const canSeeFinancials = user && (user.role === 'admin' || user.role === 'manager');
  
  // Fetch order details
  const { data: order, isLoading: isLoadingOrder, refetch: refetchOrder } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
  });
  
  // Fetch order items
  const { data: orderItems = [], isLoading: isLoadingItems, refetch: refetchItems } = useQuery({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: !!order,
  });
  
  // Get next status options based on current status
  const getNextStatusOptions = (currentStatus: string) => {
    switch(currentStatus) {
      case 'new': return ['preparing'];
      case 'preparing': return ['ready'];
      case 'ready': return ['delivered'];
      case 'delivered': return ['paid', 'cancelled'];
      default: return [];
    }
  };
  
  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'new': return 'default';
      case 'preparing': return 'secondary';
      case 'ready': return 'default';
      case 'delivered': return 'outline';
      case 'paid': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };
  
  // Update order status
  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    setIsUpdating(true);
    
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: 'PUT',
        data: { status: newStatus }
      });
      
      // Notify via WebSocket
      sendMessage('ORDER_UPDATED', { 
        orderId, 
        status: newStatus,
        tableId: order.tableId
      });
      
      // Refetch order data
      await refetchOrder();
      
      // Call onStatusChange callback if provided
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Calculate order total
  const orderTotal = orderItems.reduce((total: number, item: any) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  if (isLoadingOrder) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!order) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">{t('orders.notFound')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{t('orders.orderDetails')} #{order.id}</span>
          <Badge variant={getStatusVariant(order.status)}>
            {t(`orders.${order.status}`)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('tables.tableNumber')}
            </p>
            <p className="mt-1">{order.tableNumber}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('orders.createdAt')}
            </p>
            <p className="mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('orders.updatedAt')}
            </p>
            <p className="mt-1">{formatDateTime(order.updatedAt)}</p>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">{t('orders.items')}</h3>
          
          {isLoadingItems ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orderItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {t('orders.noItems')}
            </div>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {item.notes && (
                      <p className="text-sm text-gray-500">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    {canSeeFinancials ? (
                      <>
                        <p>{item.quantity} x {formatCurrency(item.price)}</p>
                        <p className="font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {canSeeFinancials && (
                <div className="flex justify-between items-center pt-2">
                  <p className="font-bold">{t('orders.total')}</p>
                  <p className="font-bold">{formatCurrency(orderTotal)}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Status Actions */}
        {canEdit && order.status !== 'paid' && order.status !== 'cancelled' && (
          <>
            <Separator className="my-4" />
            
            <div>
              <h3 className="font-medium mb-3">{t('orders.updateStatus')}</h3>
              
              <div className="flex flex-wrap gap-2">
                {getNextStatusOptions(order.status).map(status => (
                  <Button
                    key={status}
                    variant={status === 'cancelled' ? 'destructive' : 'default'}
                    disabled={isUpdating}
                    onClick={() => updateOrderStatus(status)}
                  >
                    {isUpdating ? t('common.loading') : t(`orders.markAs${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
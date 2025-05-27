import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { OrderEditDialog } from './OrderEditDialog';
import { formatDateTime, formatCurrency } from '@/utils/format';

interface OrderListProps {
  orders: any[];
  onUpdateOrder: (id: number, data: any) => void;
  isLoading?: boolean;
  canEdit?: boolean;
}

export function OrderList({ 
  orders, 
  onUpdateOrder, 
  isLoading = false, 
  canEdit = false 
}: OrderListProps) {
  const { t } = useTranslation();
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [editOrder, setEditOrder] = useState<any>(null);
  
  // Get order status badge variant
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
  
  // Format total amount
  const getOrderTotal = (order: any) => {
    return formatCurrency(order.totalAmount);
  };
  
  return (
    <div>
      <Table>
        <TableCaption>{orders.length === 0 ? t('orders.noOrders') : ''}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t('orders.id')}</TableHead>
            <TableHead>{t('tables.tableNumber')}</TableHead>
            <TableHead>{t('orders.status')}</TableHead>
            <TableHead>{t('orders.items')}</TableHead>
            <TableHead>{t('orders.totalAmount')}</TableHead>
            <TableHead>{t('orders.createdAt')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                {t('orders.noOrders')}
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>{order.tableNumber}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {t(`orders.${order.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>{order.itemCount || 0}</TableCell>
                <TableCell>{getOrderTotal(order)}</TableCell>
                <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewOrder(order)}
                    >
                      {t('common.view')}
                    </Button>
                    {canEdit && (
                      <Button 
                        size="sm"
                        onClick={() => setEditOrder(order)}
                      >
                        {t('common.edit')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Order Details Dialog */}
      {viewOrder && (
        <OrderDetailsDialog
          open={!!viewOrder}
          onOpenChange={() => setViewOrder(null)}
          order={viewOrder}
        />
      )}
      
      {/* Order Edit Dialog */}
      {editOrder && (
        <OrderEditDialog
          open={!!editOrder}
          onOpenChange={() => setEditOrder(null)}
          defaultValues={editOrder}
          onSubmit={(data) => {
            onUpdateOrder(editOrder.id, data);
            setEditOrder(null);
          }}
        />
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatCurrency } from '@/utils/format';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order
}: OrderDetailsDialogProps) {
  const { t } = useTranslation();
  
  // Fetch order items
  const { data: orderItems = [], isLoading } = useQuery({
    queryKey: [`/api/orders/${order.id}/items`],
    enabled: open,
  });
  
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t('orders.orderDetails')} #{order.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('orders.id')}
              </p>
              <p className="mt-1">#{order.id}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('tables.tableNumber')}
              </p>
              <p className="mt-1">{order.tableNumber}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('orders.status')}
              </p>
              <p className="mt-1">
                <Badge variant={getStatusVariant(order.status)}>
                  {t(`orders.${order.status}`)}
                </Badge>
              </p>
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
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('orders.totalAmount')}
              </p>
              <p className="mt-1 font-bold">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>
          
          {/* Order Items */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              {t('orders.items')}
            </h3>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.product')}</TableHead>
                  <TableHead className="text-right">{t('orders.quantity')}</TableHead>
                  <TableHead className="text-right">{t('orders.price')}</TableHead>
                  <TableHead className="text-right">{t('orders.subtotal')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : orderItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      {t('orders.noItems')}
                    </TableCell>
                  </TableRow>
                ) : (
                  orderItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-500">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
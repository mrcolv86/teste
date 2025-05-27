import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X, Minus, Plus, Trash, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { useWebSocket } from '@/lib/websocket';
import { formatCurrency } from '@/utils/format';

interface CustomerOrderProps {
  cart: any[];
  tableId: number;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  onClose: () => void;
}

export function CustomerOrder({
  cart,
  tableId,
  updateQuantity,
  removeFromCart,
  clearCart,
  onClose
}: CustomerOrderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage } = useWebSocket();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Submit order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de fazer o pedido",
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create order
      const orderData = {
        tableId,
        status: 'new',
        totalAmount: cartTotal,
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      const order = await response.json();
      
      // Create order items
      await Promise.all(
        cart.map(item => 
          fetch('/api/order-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              notes: notes,
            }),
          })
        )
      );
      
      // Notify via WebSocket
      sendMessage({ type: 'NEW_ORDER', orderId: order.id, tableId });
      
      // Clear cart and reset notes
      clearCart();
      setNotes('');
      
      // Show success animation
      setOrderSuccess(true);
      
      // Wait for animation then close
      setTimeout(() => {
        setOrderSuccess(false);
        onClose();
      }, 3000);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar pedido. Tente novamente.",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Success animation screen
  if (orderSuccess) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center space-y-6 p-8">
        <div className="animate-bounce">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-green-600">Pedido Enviado!</h2>
          <p className="text-muted-foreground">
            Seu pedido foi enviado para a cozinha e chegará em breve.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Tempo estimado: 15-20 minutos</span>
        </div>
        <div className="animate-pulse text-amber-600 font-medium">
          Voltando ao cardápio...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center pb-4 border-b">
        <h2 className="text-xl font-semibold">
          Seu Pedido
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Cart items */}
      <div className="flex-grow overflow-auto py-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {t('orders.emptyCart')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t('orders.addItemsToCart')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between items-center border-b pb-3">
                <div className="flex-grow">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(item.price)} x {item.quantity}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="w-6 text-center">{item.quantity}</span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-destructive"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Observações do pedido */}
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center mb-2">
                <MessageSquare className="h-4 w-4 text-amber-600 mr-2" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Observações do pedido
                </p>
              </div>
              <textarea
                placeholder="Ex: Sem cebola na pizza, cerveja bem gelada, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-amber-200 dark:border-amber-700 rounded-md bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                {notes.length}/200 caracteres
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Order summary */}
      <div className="pt-4 border-t mt-auto">
        <div className="flex justify-between font-medium text-lg mb-4">
          <span>{t('orders.total')}</span>
          <span>{formatCurrency(cartTotal)}</span>
        </div>
        
        <Button 
          className="w-full py-6" 
          size="lg"
          onClick={handleSubmitOrder}
          disabled={cart.length === 0 || isSubmitting}
        >
          {isSubmitting ? t('common.loading') : t('orders.placeOrder')}
        </Button>
      </div>
    </div>
  );
}
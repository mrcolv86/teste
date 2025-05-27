import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { useTranslation } from 'react-i18next';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export function useWebSocketSimple() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Create WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setConnected(false);
      
      // Try to reconnect after 3 seconds unless it was a normal closure
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('WebSocket message received:', message);
        
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'CONNECTED':
        console.log('WebSocket connected:', message.message);
        break;
        
      case 'AUTH_CONFIRMED':
        console.log('WebSocket authentication confirmed:', message.userId);
        break;
        
      case 'TABLE_JOINED':
        console.log('Joined table:', message.tableId);
        break;
        
      case 'NEW_ORDER':
        toast({
          title: t('notifications.newOrder'),
          description: message.data?.table?.number 
            ? `${t('tables.tableNumber')} ${message.data.table.number}` 
            : t('notifications.newOrderReceived'),
          variant: 'default',
        });
        break;
        
      case 'WAITER_CALLED':
        toast({
          title: t('notifications.waiterCalled'),
          description: `${t('tables.tableNumber')} ${message.data?.tableNumber || ''}`,
          variant: 'default',
        });
        break;
        
      case 'ORDER_UPDATED':
        toast({
          title: t('notifications.statusChanged'),
          description: `${t('orders.status')}: ${t(`orders.${message.data?.status || 'updated'}`)}`,
          variant: 'default',
        });
        break;
        
      case 'TABLE_UPDATED':
        toast({
          title: t('notifications.tableUpdated'),
          description: message.data?.number
            ? `${t('tables.tableNumber')} ${message.data.number}`
            : t('notifications.tableStatusChanged'),
          variant: 'default',
        });
        break;
    }
  }, [toast, t]);

  // Send a message
  const sendMessage = useCallback((type: string, data: Record<string, any> = {}) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message, WebSocket not connected');
      return;
    }
    
    const message = JSON.stringify({ type, ...data });
    socket.send(message);
    console.log('WebSocket message sent:', message);
  }, [socket]);

  // Authenticate with the server (for staff)
  const authenticate = useCallback((userId: number, role: string) => {
    sendMessage('AUTH', { userId, role });
  }, [sendMessage]);

  // Join a table (for customer view)
  const joinTable = useCallback((tableId: number) => {
    sendMessage('JOIN_TABLE', { tableId });
  }, [sendMessage]);

  // Call a waiter
  const callWaiter = useCallback((tableId?: number) => {
    sendMessage('CALL_WAITER', { tableId });
    
    toast({
      title: t('tables.waiterCalled'),
      description: t('tables.waiterCalledDescription'),
      variant: 'default',
    });
  }, [sendMessage, toast, t]);

  return {
    connected,
    sendMessage,
    authenticate,
    joinTable,
    callWaiter
  };
}
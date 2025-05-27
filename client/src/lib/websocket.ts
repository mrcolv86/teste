// Simple WebSocket client implementation for brewery management
import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// WebSocket message type for type checking
export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// Create a singleton WebSocket instance to be shared across the app
let socketInstance: WebSocket | null = null;
let messageHandlers: Map<string, ((message: any) => void)[]> = new Map();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

/**
 * Initialize the WebSocket connection
 */
function createWebSocketConnection() {
  if (socketInstance && (socketInstance.readyState === WebSocket.OPEN || socketInstance.readyState === WebSocket.CONNECTING)) {
    console.log('WebSocket connection already exists');
    return socketInstance;
  }

  try {
    // Create WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket server:', wsUrl);
    
    // Create new WebSocket connection
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      reconnectAttempts = 0;
      
      // Dispatch connected event to listeners
      dispatchEvent('CONNECTED', { connected: true });
    };
    
    socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code}, ${event.reason}`);
      
      // Attempt to reconnect unless it was a normal closure
      if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(createWebSocketConnection, RECONNECT_DELAY_MS);
      }
      
      // Dispatch disconnected event to listeners
      dispatchEvent('DISCONNECTED', { connected: false });
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket connection error:', error);
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        
        // Dispatch event to specific handlers
        dispatchEvent(message.type, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socketInstance = socket;
    return socket;
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    return null;
  }
}

/**
 * Closes the WebSocket connection if it exists
 */
function closeWebSocketConnection() {
  if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
    socketInstance.close(1000, 'Normal closure');
    socketInstance = null;
  }
}

/**
 * Send a message through the WebSocket
 */
function sendMessage(type: string, data: Record<string, any> = {}) {
  if (!socketInstance || socketInstance.readyState !== WebSocket.OPEN) {
    console.error('Cannot send message, WebSocket not connected');
    return false;
  }

  try {
    const message = JSON.stringify({ type, ...data });
    socketInstance.send(message);
    console.log('WebSocket message sent:', message);
    return true;
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return false;
  }
}

/**
 * Add a handler for a specific message type
 */
function addMessageHandler(type: string, handler: (message: any) => void) {
  if (!messageHandlers.has(type)) {
    messageHandlers.set(type, []);
  }
  messageHandlers.get(type)?.push(handler);
}

/**
 * Remove a handler for a specific message type
 */
function removeMessageHandler(type: string, handler: (message: any) => void) {
  if (!messageHandlers.has(type)) {
    return;
  }
  
  const handlers = messageHandlers.get(type);
  if (handlers) {
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
}

/**
 * Dispatch a message to all registered handlers
 */
function dispatchEvent(type: string, message: any) {
  const handlers = messageHandlers.get(type);
  if (handlers) {
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in WebSocket handler for "${type}":`, error);
      }
    });
  }
}

/**
 * React hook for using WebSocket with automatic connection management
 */
export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Connect to WebSocket on component mount
  useEffect(() => {
    // Create WebSocket connection
    const socket = createWebSocketConnection();
    
    // Add connection status handlers
    const connectedHandler = () => setConnected(true);
    const disconnectedHandler = () => setConnected(false);
    
    addMessageHandler('CONNECTED', connectedHandler);
    addMessageHandler('DISCONNECTED', disconnectedHandler);
    
    // Set initial connected state
    if (socket?.readyState === WebSocket.OPEN) {
      setConnected(true);
    }
    
    // Add default message handlers for common events
    const orderNotificationHandler = (message: WebSocketMessage) => {
      // APENAS funcionários devem ver notificações de novos pedidos
      // Clientes no menu QR NÃO devem ver essas notificações
      if (message.type === 'NEW_ORDER') {
        // Esta notificação não deve aparecer no menu do cliente
        console.log('New order received but not shown to customer');
      }
    };
    
    const waiterCallHandler = (message: WebSocketMessage) => {
      // APENAS funcionários devem ver notificações de chamadas de garçom
      // Clientes no menu QR NÃO devem ver essas notificações
      if (message.type === 'WAITER_CALLED') {
        // Esta notificação não deve aparecer no menu do cliente
        console.log('Waiter called but not shown to customer');
      }
    };
    
    const orderUpdateHandler = (message: WebSocketMessage) => {
      // APENAS funcionários devem ver atualizações de status de pedido
      // Clientes no menu QR NÃO devem ver essas notificações
      if (message.type === 'ORDER_UPDATED') {
        // Esta notificação não deve aparecer no menu do cliente
        console.log('Order update received but not shown to customer');
      }
    };
    
    const tableUpdateHandler = (message: WebSocketMessage) => {
      // APENAS funcionários devem ver atualizações de mesa
      // Clientes no menu QR NÃO devem ver essas notificações
      if (message.type === 'TABLE_UPDATED') {
        // Esta notificação não deve aparecer no menu do cliente
        console.log('Table update received but not shown to customer');
      }
    };
    
    addMessageHandler('NEW_ORDER', orderNotificationHandler);
    addMessageHandler('WAITER_CALLED', waiterCallHandler);
    addMessageHandler('ORDER_UPDATED', orderUpdateHandler);
    addMessageHandler('TABLE_UPDATED', tableUpdateHandler);
    
    // Cleanup function
    return () => {
      removeMessageHandler('CONNECTED', connectedHandler);
      removeMessageHandler('DISCONNECTED', disconnectedHandler);
      removeMessageHandler('NEW_ORDER', orderNotificationHandler);
      removeMessageHandler('WAITER_CALLED', waiterCallHandler);
      removeMessageHandler('ORDER_UPDATED', orderUpdateHandler);
      removeMessageHandler('TABLE_UPDATED', tableUpdateHandler);
    };
  }, [toast, t]);

  // Authenticate with the server (for staff)
  const authenticate = useCallback((userId: number, role: string) => {
    sendMessage('AUTH', { userId, role });
  }, []);

  // Join a table (for customer view)
  const joinTable = useCallback((tableId: number) => {
    sendMessage('JOIN_TABLE', { tableId });
  }, []);

  // Call a waiter
  const callWaiter = useCallback((tableId?: number) => {
    sendMessage('CALL_WAITER', { tableId });
    
    toast({
      title: t('tables.waiterCalled'),
      description: t('tables.waiterCalledDescription'),
      variant: 'default',
    });
  }, [toast, t]);

  return {
    connected,
    sendMessage,
    authenticate,
    joinTable,
    callWaiter,
    addMessageHandler,
    removeMessageHandler
  };
}
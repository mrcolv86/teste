import { useEffect, useState } from 'react';
import { useToast } from './use-toast';
import { useTranslation } from 'react-i18next';

type WebSocketMessageHandler = (message: any) => void;

interface WebSocketUser {
  id: number;
  role: string;
}

export function useWebSocket(user: WebSocketUser | null) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Custom message handlers
  const [messageHandlers, setMessageHandlers] = useState<
    Record<string, WebSocketMessageHandler[]>
  >({});
  
  // Register a message handler
  const addMessageHandler = (type: string, handler: WebSocketMessageHandler) => {
    setMessageHandlers(prev => {
      const handlers = prev[type] || [];
      return {
        ...prev,
        [type]: [...handlers, handler]
      };
    });
    
    // Return a function to clean up the handler
    return () => {
      setMessageHandlers(prev => {
        const handlers = prev[type] || [];
        return {
          ...prev,
          [type]: handlers.filter(h => h !== handler)
        };
      });
    };
  };
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log("Connecting to WebSocket:", wsUrl);
      
      try {
        const webSocket = new WebSocket(wsUrl);
        
        webSocket.onopen = () => {
          console.log("WebSocket connection established");
          setConnected(true);
          
          // Authenticate with the server
          webSocket.send(JSON.stringify({
            type: "AUTH",
            userId: user.id,
            role: user.role
          }));
        };
        
        webSocket.onclose = (event) => {
          console.log("WebSocket connection closed", event.code, event.reason);
          setConnected(false);
          
          // Reconnect unless it was intentionally closed
          if (event.code !== 1000) {
            setTimeout(() => {
              console.log("Attempting to reconnect...");
              connectWebSocket();
            }, 3000);
          }
        };
        
        webSocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnected(false);
        };
        
        webSocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("WebSocket message received:", message);
            
            // Call any registered message handlers
            if (message.type && messageHandlers[message.type]) {
              messageHandlers[message.type].forEach(handler => handler(message));
            }
            
            // Handle different message types
            handleDefaultMessages(message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
        
        setSocket(webSocket);
        return webSocket;
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          connectWebSocket();
        }, 5000);
        return null;
      }
    };
    
    const webSocket = connectWebSocket();
    
    return () => {
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.close(1000, "Component unmounted");
      }
    };
  }, [user]);
  
  // Handle default message types
  const handleDefaultMessages = (message: any) => {
    switch (message.type) {
      case "NEW_ORDER":
        if (user && (user.role === "admin" || user.role === "manager" || user.role === "waiter")) {
          toast({
            title: t("notifications.newOrder"),
            description: message.data?.table?.number ? 
              `${t("tables.tableNumber")} ${message.data.table.number}` : 
              t("notifications.newOrderReceived"),
            variant: "default",
          });
        }
        break;
        
      case "WAITER_CALLED":
        if (user && (user.role === "admin" || user.role === "manager" || user.role === "waiter")) {
          toast({
            title: t("notifications.waiterCalled"),
            description: `${t("tables.tableNumber")} ${message.data?.tableNumber || ''}`,
            variant: "default",
          });
        }
        break;
        
      case "ORDER_UPDATED":
        toast({
          title: t("notifications.statusChanged"),
          description: `${t("orders.status")}: ${t(`orders.${message.data?.status || 'updated'}`)}`,
          variant: "default",
        });
        break;
        
      case "TABLE_UPDATED":
        if (user && (user.role === "admin" || user.role === "manager" || user.role === "waiter")) {
          toast({
            title: t("notifications.tableUpdated"),
            description: message.data?.number ?
              `${t("tables.tableNumber")} ${message.data.number}` :
              t("notifications.tableStatusChanged"),
            variant: "default",
          });
        }
        break;
    }
  };
  
  // Send a message through the WebSocket
  const sendMessage = (type: string, data: any = {}) => {
    if (socket && connected) {
      socket.send(JSON.stringify({ type, ...data }));
    } else {
      console.error("Cannot send message, socket not connected");
    }
  };
  
  // Join a table (for customer view)
  const joinTable = (tableId: number) => {
    sendMessage("JOIN_TABLE", { tableId });
  };
  
  // Call a waiter
  const callWaiter = (tableId?: number) => {
    sendMessage("CALL_WAITER", { tableId });
    
    toast({
      title: t("tables.waiterCalled"),
      description: t("tables.waiterCalledDescription"),
      variant: "default",
    });
  };
  
  return {
    connected,
    sendMessage,
    joinTable,
    callWaiter,
    addMessageHandler
  };
}
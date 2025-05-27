import { useEffect, useState } from 'react';
import { useToast } from './use-toast';
import { useTranslation } from 'react-i18next';

export function useSimpleWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log("Connecting to WebSocket:", wsUrl);
    
    try {
      const webSocket = new WebSocket(wsUrl);
      
      webSocket.onopen = () => {
        console.log("WebSocket connection established");
        setConnected(true);
      };
      
      webSocket.onclose = (event) => {
        console.log("WebSocket connection closed", event.code, event.reason);
        setConnected(false);
        
        // Reconnect unless it was intentionally closed
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log("Attempting to reconnect...");
          }, 3000);
        }
      };
      
      webSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      webSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);
          
          // Handle different message types
          switch (message.type) {
            case "NEW_ORDER":
              toast({
                title: t("notifications.newOrder"),
                description: message.data?.table?.number ? 
                  `${t("tables.tableNumber")} ${message.data.table.number}` : 
                  t("notifications.newOrderReceived"),
                variant: "default",
              });
              break;
              
            case "WAITER_CALLED":
              toast({
                title: t("notifications.waiterCalled"),
                description: `${t("tables.tableNumber")} ${message.data?.tableNumber || ''}`,
                variant: "default",
              });
              break;
              
            case "ORDER_UPDATED":
              toast({
                title: t("notifications.statusChanged"),
                description: `${t("orders.status")}: ${t(`orders.${message.data?.status || 'updated'}`)}`,
                variant: "default",
              });
              break;
              
            case "TABLE_UPDATED":
              toast({
                title: t("notifications.tableUpdated"),
                description: message.data?.number ?
                  `${t("tables.tableNumber")} ${message.data.number}` :
                  t("notifications.tableStatusChanged"),
                variant: "default",
              });
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      setSocket(webSocket);
      
      return () => {
        if (webSocket.readyState === WebSocket.OPEN) {
          webSocket.close();
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [toast, t]);

  // Send a message through the WebSocket
  const sendMessage = (type: string, data: any = {}) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
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
  
  // Authenticate with the server (for staff)
  const authenticate = (userId: number, role: string) => {
    sendMessage("AUTH", { userId, role });
  };
  
  return {
    connected,
    sendMessage,
    joinTable,
    callWaiter,
    authenticate
  };
}
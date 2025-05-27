/// <reference lib="webworker" />
// Declare tipo para o contexto do service worker
declare const self: ServiceWorkerGlobalScope;

// Service Worker para gerenciar notificações push
const CACHE_NAME = 'bierserv-cache-v1';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  self.skipWaiting(); // Garantir que o SW seja ativado imediatamente
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
  // Reivindicar o controle de todas as páginas imediatamente
  event.waitUntil(self.clients.claim());
});

// Recebimento de eventos push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido.');
  
  let data: any = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Notificação',
        body: event.data.text()
      };
    }
  }
  
  const title = data.title || 'BierServ';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'default',
    data: data.data || {},
    vibrate: [300, 100, 300, 100, 300] as number[],
    renotify: data.renotify || true,
    requireInteraction: data.requireInteraction || true
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manipulação de cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event.notification.tag);
  
  event.notification.close();
  
  // Dados específicos da notificação
  const notificationData = event.notification.data;
  let url = '/';
  
  if (notificationData) {
    if (notificationData.tableId) {
      url = `/tables?highlight=${notificationData.tableId}`;
    } else if (notificationData.orderId) {
      url = `/orders?highlight=${notificationData.orderId}`;
    } else if (notificationData.url) {
      url = notificationData.url;
    }
  }
  
  // Foca na janela existente ou abre uma nova
  event.waitUntil(
    self.clients.matchAll({
      type: 'window'
    }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
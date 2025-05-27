// Serviço de notificações push
import webpush from 'web-push';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Gerar VAPID keys para o serviço de notificações push
// Em produção, estas chaves devem ser geradas uma vez e armazenadas no .env
// Você pode gerar suas próprias chaves usando: npx web-push generate-vapid-keys
const vapidKeys = process.env.VAPID_KEYS ? 
  JSON.parse(process.env.VAPID_KEYS) : 
  webpush.generateVAPIDKeys();

// Configurar o serviço de web-push
webpush.setVapidDetails(
  'mailto:contato@bierserv.com', // E-mail de contato
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Armazenar as inscrições de push em memória (para desenvolvimento)
// Em produção, estas inscrições devem ser armazenadas no banco de dados
const pushSubscriptions: Map<string, any> = new Map();

// Adicionar uma nova inscrição
export async function addPushSubscription(subscription: any, userId?: number, role?: string) {
  try {
    const subscriptionId = JSON.stringify(subscription.endpoint);
    pushSubscriptions.set(subscriptionId, {
      subscription,
      userId,
      role,
      createdAt: new Date()
    });
    
    console.log(`Inscrição de push adicionada para usuário ${userId}, função ${role}`);
    return true;
  } catch (error) {
    console.error('Erro ao adicionar inscrição de push:', error);
    return false;
  }
}

// Remover uma inscrição
export async function removePushSubscription(subscription: any) {
  try {
    const subscriptionId = JSON.stringify(subscription.endpoint);
    pushSubscriptions.delete(subscriptionId);
    console.log('Inscrição de push removida');
    return true;
  } catch (error) {
    console.error('Erro ao remover inscrição de push:', error);
    return false;
  }
}

// Enviar notificação push para todos os dispositivos inscritos
export async function sendPushNotificationToAll(data: any) {
  console.log(`Enviando notificação push para todos os dispositivos: ${JSON.stringify(data)}`);
  
  const failedSubscriptions: string[] = [];
  
  // Método alternativo para evitar erro de compilação com o Array.from
  const allSubscriptions: {key: string, value: any}[] = [];
  pushSubscriptions.forEach((value, key) => {
    allSubscriptions.push({ key, value });
  });
  
  for (const { key, value } of allSubscriptions) {
    try {
      await webpush.sendNotification(
        value.subscription,
        JSON.stringify(data)
      );
      console.log(`Notificação enviada para ${key}`);
    } catch (error) {
      console.error(`Erro ao enviar notificação para ${key}:`, error);
      failedSubscriptions.push(key);
      
      // Se o erro for que a inscrição expirou ou é inválida, removê-la
      if (
        (error as any).statusCode === 404 || 
        (error as any).statusCode === 410
      ) {
        console.log(`Removendo inscrição inválida: ${key}`);
        pushSubscriptions.delete(key);
      }
    }
  }
  
  return {
    success: true,
    sent: pushSubscriptions.size - failedSubscriptions.length,
    failed: failedSubscriptions.length
  };
}

// Enviar notificação push para um usuário específico
export async function sendPushNotificationToUser(userId: number, data: any) {
  console.log(`Enviando notificação push para usuário ${userId}: ${JSON.stringify(data)}`);
  
  // Método alternativo para evitar erro de compilação com o Array.from
  const userSubscriptions: {key: string, value: any}[] = [];
  pushSubscriptions.forEach((value, key) => {
    if (value.userId === userId) {
      userSubscriptions.push({ key, value });
    }
  });
  
  console.log(`Encontradas ${userSubscriptions.length} inscrições para o usuário ${userId}`);
  
  const failedSubscriptions: string[] = [];
  
  for (const { key, value } of userSubscriptions) {
    try {
      await webpush.sendNotification(
        value.subscription,
        JSON.stringify(data)
      );
      console.log(`Notificação enviada para ${key}`);
    } catch (error) {
      console.error(`Erro ao enviar notificação para ${key}:`, error);
      failedSubscriptions.push(key);
      
      // Se o erro for que a inscrição expirou ou é inválida, removê-la
      if (
        (error as any).statusCode === 404 || 
        (error as any).statusCode === 410
      ) {
        console.log(`Removendo inscrição inválida: ${key}`);
        pushSubscriptions.delete(key);
      }
    }
  }
  
  return {
    success: true,
    sent: userSubscriptions.length - failedSubscriptions.length,
    failed: failedSubscriptions.length
  };
}

// Enviar notificação push para usuários com uma função específica
export async function sendPushNotificationByRole(role: string, data: any) {
  console.log(`Enviando notificação push para função ${role}: ${JSON.stringify(data)}`);
  
  // Método alternativo para evitar erro de compilação com o Array.from
  const roleSubscriptions: {key: string, value: any}[] = [];
  pushSubscriptions.forEach((value, key) => {
    if (value.role === role) {
      roleSubscriptions.push({ key, value });
    }
  });
  
  console.log(`Encontradas ${roleSubscriptions.length} inscrições para a função ${role}`);
  
  const failedSubscriptions: string[] = [];
  
  for (const { key, value } of roleSubscriptions) {
    try {
      await webpush.sendNotification(
        value.subscription,
        JSON.stringify(data)
      );
      console.log(`Notificação enviada para ${key}`);
    } catch (error) {
      console.error(`Erro ao enviar notificação para ${key}:`, error);
      failedSubscriptions.push(key);
      
      // Se o erro for que a inscrição expirou ou é inválida, removê-la
      if (
        (error as any).statusCode === 404 || 
        (error as any).statusCode === 410
      ) {
        console.log(`Removendo inscrição inválida: ${key}`);
        pushSubscriptions.delete(key);
      }
    }
  }
  
  return {
    success: true,
    sent: roleSubscriptions.length - failedSubscriptions.length,
    failed: failedSubscriptions.length
  };
}

// Obter a chave pública VAPID para compartilhar com o cliente
export function getVapidPublicKey() {
  return vapidKeys.publicKey;
}
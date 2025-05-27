import React, { useState, useEffect } from 'react';
import { Bell, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function MobilePushPermission() {
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    // Verificar se é um dispositivo móvel
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice && 'Notification' in window) {
      // Mostrar modal apenas se ainda não decidiu sobre notificações
      if (Notification.permission === 'default') {
        // Mostrar modal após um breve atraso
        setTimeout(() => {
          setShowModal(true);
          console.log('Mostrando modal de permissão para notificações móveis');
        }, 1000);
      }
    }
  }, []);
  
  // Função para solicitar permissão diretamente
  const requestPermission = () => {
    console.log('Solicitando permissão para notificações...');
    
    // Tentar registrar o service worker primeiro
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
          
          // Agora solicitar permissão para notificações
          return Notification.requestPermission();
        })
        .then((permission) => {
          console.log('Resultado da permissão:', permission);
          
          if (permission === 'granted') {
            // Enviar uma notificação de teste
            try {
              setTimeout(() => {
                new Notification('BierServ', {
                  body: 'Notificações ativadas com sucesso!',
                  icon: '/favicon.ico'
                });
              }, 500);
            } catch (error) {
              console.error('Erro ao enviar notificação de teste:', error);
            }
          }
          
          // Fechar o modal
          setShowModal(false);
        })
        .catch((error) => {
          console.error('Erro ao solicitar permissão:', error);
          setShowModal(false);
        });
    } else {
      // Se service worker não for suportado, tentar apenas a permissão
      Notification.requestPermission()
        .then((permission) => {
          console.log('Resultado da permissão (sem SW):', permission);
          setShowModal(false);
        })
        .catch((error) => {
          console.error('Erro ao solicitar permissão:', error);
          setShowModal(false);
        });
    }
  };
  
  // Fechar o modal sem solicitar permissão
  const closeModal = () => {
    setShowModal(false);
  };
  
  if (!showModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-full mr-3">
              <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold">Ativar Notificações</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm mb-4">
          Para receber alertas de chamados e novos pedidos, precisamos da sua permissão para enviar notificações.
        </p>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 mb-4">
          <div className="flex items-start">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Você receberá alertas em tempo real sobre chamados de garçom e novos pedidos, mesmo com o aplicativo em segundo plano.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={closeModal}>
            Agora não
          </Button>
          <Button 
            className="bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
            onClick={requestPermission}
          >
            Permitir Notificações
          </Button>
        </div>
      </Card>
    </div>
  );
}
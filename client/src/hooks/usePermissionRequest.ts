import { useState, useEffect } from 'react';

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

export function usePermissionRequest() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [isMobile, setIsMobile] = useState(false);

  // Verificar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };
    
    setIsMobile(checkMobile());
  }, []);

  // Verificar status inicial de permissão
  useEffect(() => {
    const checkPermission = () => {
      if (!('Notification' in window)) {
        setPermissionStatus('unsupported');
        return;
      }

      // Mapeamento do status de permissão para nosso tipo
      const statusMap: Record<NotificationPermission, PermissionStatus> = {
        'default': 'prompt',
        'granted': 'granted',
        'denied': 'denied'
      };
      
      setPermissionStatus(statusMap[Notification.permission]);
    };

    checkPermission();
  }, []);

  // Função para solicitar permissão com compatibilidade em diferentes dispositivos
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Notificações não são suportadas neste navegador');
      return false;
    }

    // Verificar o status atual - se já for granted, não precisamos solicitar
    if (Notification.permission === 'granted') {
      setPermissionStatus('granted');
      return true;
    }

    // Se já foi negado, não podemos solicitar novamente pelo navegador (limitação de segurança)
    if (Notification.permission === 'denied') {
      setPermissionStatus('denied');
      return false;
    }

    console.log('Solicitando permissão para notificações...');
    
    try {
      // Tentativa com Promise (navegadores modernos)
      if (typeof Notification.requestPermission === 'function') {
        let permission;
        
        // Verificar se a implementação é baseada em Promise ou callback
        if (Notification.requestPermission.length === 0) {
          permission = await Notification.requestPermission();
          console.log('Resultado Promise:', permission);
        } else {
          // Versão callback para compatibilidade
          permission = await new Promise<NotificationPermission>((resolve) => {
            Notification.requestPermission((result) => {
              resolve(result);
            });
          });
          console.log('Resultado Callback:', permission);
        }
        
        // Atualizar o status
        setPermissionStatus(permission === 'granted' ? 'granted' : 
                            permission === 'denied' ? 'denied' : 'prompt');
        
        return permission === 'granted';
      } else {
        // Fallback para navegadores muito antigos
        console.warn('Método requestPermission não disponível');
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  };

  return {
    permissionStatus,
    requestPermission,
    isMobile,
  };
}
import { useCallback } from 'react';

export function useMobileNotifications() {
  // Enhanced mobile-friendly notification system
  const showMobileAlert = useCallback((title: string, message: string) => {
    console.log('📱 Alerta móvel:', title, message);
    
    // Immediate strong vibration for mobile devices
    if (navigator.vibrate) {
      // Multiple vibration patterns for different urgency
      navigator.vibrate([400, 200, 400, 200, 400]);
      console.log('📳 Vibração ativada no dispositivo');
    }
    
    // Enhanced audio alert for all devices
    const playMobileAudio = () => {
      try {
        // Create audio context with user interaction unlock
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Resume audio context if suspended (common on mobile)
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('🔊 Contexto de áudio ativado');
            generateAlertTone();
          });
        } else {
          generateAlertTone();
        }
        
        function generateAlertTone() {
          // Create more prominent sound for mobile
          const times = [0, 0.3, 0.6];
          const frequencies = [1000, 800, 1200];
          
          times.forEach((time, index) => {
            setTimeout(() => {
              try {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequencies[index], audioContext.currentTime);
                oscillator.type = 'square';
                
                // Higher volume for mobile
                gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.25);
                
                console.log(`🎵 Tom ${index + 1} reproduzido`);
              } catch (e) {
                console.log('Erro no tom:', e);
              }
            }, time * 1000);
          });
        }
        
      } catch (error) {
        console.log('❌ Áudio não disponível:', error);
        // Fallback: try simple beep
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAZBziR2O3O');
          audio.play().catch(() => console.log('Fallback beep falhou'));
        } catch (e) {
          console.log('Fallback beep não disponível');
        }
      }
    };
    
    // Execute audio immediately
    playMobileAudio();
    
    // Try browser notification for visual alert
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification(title, {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
            silent: true, // We handle audio ourselves
            vibrate: [400, 200, 400], // Extra vibration
            tag: 'brewery-alert'
          });
          
          // Auto close notification
          setTimeout(() => {
            try {
              notification.close();
            } catch (e) {
              console.log('Notificação já foi fechada');
            }
          }, 6000);
          
          console.log('🔔 Notificação visual criada');
        } catch (error) {
          console.log('❌ Erro na notificação visual:', error);
        }
      } else {
        console.log('🔕 Permissão de notificação não concedida - apenas áudio e vibração');
      }
    } else {
      console.log('🔇 Notificações não suportadas - apenas áudio e vibração');
    }
    
    // Additional mobile feedback
    if (window.navigator && window.navigator.serviceWorker) {
      console.log('📱 Service Worker disponível para notificações avançadas');
    }
    
  }, []);

  return {
    showMobileAlert
  };
}
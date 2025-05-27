import React, { useEffect, useState } from 'react';
import { X, Bell, ShoppingCart } from 'lucide-react';

interface BigAlertProps {
  message: string;
  type: 'order' | 'waiter_request';
  title?: string;
  details?: string;
  timestamp?: Date;
  onClose: () => void;
}

export default function BigAlert({ message, type, title, details, timestamp, onClose }: BigAlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar o alerta
    setIsVisible(true);
    
    // Tocar som imediatamente
    playNotificationSound();
    
    // Auto fechar após 10 segundos
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const playNotificationSound = () => {
    try {
      // Método 1: Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (frequency: number, duration: number, delay: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };
      
      if (type === 'order') {
        // Som para novo pedido - 2 beeps
        playBeep(1000, 0.2, 0);    
        playBeep(1200, 0.2, 0.3);   
      } else {
        // Som para garçom - 3 beeps rápidos
        playBeep(800, 0.15, 0);
        playBeep(1000, 0.15, 0.2);
        playBeep(800, 0.15, 0.4);
      }
      
    } catch (error) {
      console.log('Som não disponível:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    return type === 'order' ? <ShoppingCart className="h-20 w-20" /> : <Bell className="h-20 w-20" />;
  };

  const getColors = () => {
    return type === 'order' 
      ? 'bg-green-500 text-white border-green-600'
      : 'bg-orange-500 text-white border-orange-600';
  };

  return (
    <>
      {/* Overlay escuro */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose} />
      
      {/* Alerta principal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className={`
          ${getColors()}
          rounded-3xl border-4 shadow-2xl max-w-2xl w-full mx-auto
          transform transition-all duration-300 animate-pulse
          ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}>
          <div className="p-12 text-center">
            {/* Ícone */}
            <div className="mb-8 flex justify-center">
              <div className="animate-bounce">
                {getIcon()}
              </div>
            </div>
            
            {/* Título */}
            <h1 className="text-5xl font-black mb-6">
              {title || (type === 'order' ? '🚨 NOVO PEDIDO!' : '🔔 GARÇOM CHAMADO!')}
            </h1>
            
            {/* Mensagem principal */}
            <p className="text-3xl font-bold mb-6">
              {message}
            </p>
            
            {/* Detalhes */}
            {details && (
              <p className="text-2xl mb-6 opacity-90">
                {details}
              </p>
            )}
            
            {/* Horário */}
            {timestamp && (
              <div className="text-2xl font-mono bg-black/20 rounded-xl px-6 py-4 mb-8 inline-block">
                🕐 {new Date(timestamp).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </div>
            )}
            
            {/* Botão */}
            <button
              onClick={handleClose}
              className="bg-white text-gray-900 px-12 py-6 rounded-2xl text-2xl font-black hover:bg-gray-100 transition-colors shadow-lg"
            >
              OK, ENTENDI!
            </button>
            
            {/* Botão X no canto */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 bg-black/20 rounded-full p-3 hover:bg-black/30 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
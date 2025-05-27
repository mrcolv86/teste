import React, { useEffect, useState } from 'react';
import { X, Bell, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AlertNotificationProps {
  message: string;
  type: 'order' | 'waiter_request' | 'promotion';
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
  title?: string;
  details?: string;
  timestamp?: Date;
}

export function AlertNotification({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  autoClose = true, 
  duration = 8000,
  title,
  details,
  timestamp 
}: AlertNotificationProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      
      // Play notification sound
      playNotificationSound(type);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, duration, type]);

  const playNotificationSound = (notificationType: string) => {
    try {
      // Create different audio frequencies for different notification types
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Unlock audio context on first user interaction
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const playBeep = (frequency: number, duration: number, delay: number = 0) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        oscillator.type = 'square'; // More intense sound
        
        // Higher volume - 0.8 instead of 0.3
        gainNode.gain.setValueAtTime(0.8, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };
      
      // Sons simples e diretos para cada tipo
      if (notificationType === 'order') {
        // Som para novo pedido - 2 beeps simples
        playBeep(1000, 0.2, 0);    
        playBeep(1200, 0.2, 0.3);   
      } else if (notificationType === 'waiter_request') {
        // Som para chamada de garçom - 3 beeps rápidos
        playBeep(800, 0.15, 0);
        playBeep(1000, 0.15, 0.2);
        playBeep(800, 0.15, 0.4);
      } else {
        // Som padrão - beep simples
        playBeep(800, 0.3, 0);
      }
      
    } catch (error) {
      console.log('Audio notification not available');
      // Fallback: try HTML5 audio with data URL
      try {
        const audio = new Audio();
        // Generate a simple beep sound as data URL
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp56hVFApGn+DyvmAcBjqO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAacBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmAcBjuO1/LNeSsFJHTG8N2QQAoUXrTp56hVFApGn+DyvmA==';
        audio.volume = 0.8;
        audio.play().catch(() => {
          console.log('Fallback audio also failed');
        });
      } catch (fallbackError) {
        console.log('All audio methods failed');
      }
    }
  };

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-6 w-6" />;
      case 'waiter_request':
        return <Bell className="h-6 w-6" />;
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'order':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          text: 'text-green-800 dark:text-green-200'
        };
      case 'waiter_request':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
          icon: 'text-orange-600 dark:text-orange-400',
          text: 'text-orange-800 dark:text-orange-200'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          text: 'text-blue-800 dark:text-blue-200'
        };
    }
  };

  if (!isVisible) return null;

  const colors = getColors();

  return (
    <>
      {/* Background overlay */}
      <div className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
        isShowing ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} />
      
      {/* Main alert */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 transform ${
        isShowing ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        <Card className={`p-8 shadow-2xl border-4 ${colors.bg} animate-pulse max-w-lg mx-4`}>
          <div className="text-center space-y-6">
            <div className={`${colors.icon} mx-auto animate-bounce`}>
              <div className="p-4 rounded-full bg-white/20">
                {React.cloneElement(getIcon(), { className: 'h-16 w-16' })}
              </div>
            </div>
            <div>
              <h3 className={`text-3xl font-bold ${colors.text} mb-3`}>
                {title || (type === 'order' ? '🚨 NOVO PEDIDO!' : '🔔 GARÇOM CHAMADO!')}
              </h3>
              <p className={`text-xl ${colors.text} mb-4`}>
                {message}
              </p>
              {details && (
                <p className={`text-lg ${colors.text} opacity-90 mb-4`}>
                  {details}
                </p>
              )}
              {timestamp && (
                <div className={`text-lg font-mono ${colors.text} bg-white/20 rounded-lg px-4 py-2 mb-4`}>
                  🕐 {new Date(timestamp).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </div>
              )}
            </div>
            <Button
              onClick={handleClose}
              className="mt-6 px-10 py-4 text-xl font-semibold"
              size="lg"
            >
              OK, ENTENDI!
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
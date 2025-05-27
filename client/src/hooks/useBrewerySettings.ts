import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

interface BrewerySettings {
  name: string;
  slogan?: string;
  description?: string;
  logo?: string;
  favicon?: string;
  headerLogo?: string;
  menuLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  defaultLanguage: 'pt' | 'en' | 'es';
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  socialMedia?: any;
  fontFamily?: string;
  borderRadius?: string;
  buttonStyle?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  qrMenuTitle?: string;
  qrMenuSubtitle?: string;
  qrWelcomeMessage?: string;
  darkMode?: boolean;
  customCss?: string;
}

export function useBrewerySettings() {
  const { data: settings, isLoading, error } = useQuery<BrewerySettings>({
    queryKey: ['/api/settings'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Aplicar configurações de tema dinamicamente
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Aplicar cores personalizadas
      if (settings.primaryColor) {
        root.style.setProperty('--color-primary', settings.primaryColor);
      }
      
      if (settings.secondaryColor) {
        root.style.setProperty('--color-secondary', settings.secondaryColor);
      }
      
      if (settings.accentColor) {
        root.style.setProperty('--color-accent', settings.accentColor);
      }

      // Aplicar favicon
      if (settings.favicon) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = settings.favicon;
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      // Aplicar meta title
      if (settings.metaTitle) {
        document.title = settings.metaTitle;
      } else if (settings.name) {
        document.title = `${settings.name} - Sistema de Gestão`;
      }

      // Aplicar meta description
      if (settings.metaDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', settings.metaDescription);
      }

      // Aplicar CSS customizado
      if (settings.customCss) {
        let customStyleSheet = document.getElementById('brewery-custom-css');
        if (!customStyleSheet) {
          customStyleSheet = document.createElement('style');
          customStyleSheet.id = 'brewery-custom-css';
          document.head.appendChild(customStyleSheet);
        }
        customStyleSheet.textContent = settings.customCss;
      }
    }
  }, [settings]);

  return {
    settings: settings || {
      name: 'BierServ',
      primaryColor: '#D97706',
      secondaryColor: '#047857',
      accentColor: '#F59E0B',
      defaultLanguage: 'pt' as const,
      fontFamily: 'Inter',
      borderRadius: 'medium',
      buttonStyle: 'rounded',
    },
    isLoading,
    error,
  };
}
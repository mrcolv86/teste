import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Bell, Menu, Moon, Sun, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface NavbarProps {
  onMenuButtonClick: () => void;
  mobileMenuOpen: boolean;
  onCloseMenu: () => void;
}

export function Navbar({ onMenuButtonClick, mobileMenuOpen }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUserLanguage } = useAuth();
  
  // Implementação segura para o tema com fallback
  let theme = 'light';
  let toggleTheme = () => {};
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    // Silenciamos o erro para não quebrar o componente
    console.log("Tema não disponível, usando fallback");
  }
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Notifications query
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  const unreadNotifications = notifications.filter((n: any) => !n.read);

  // Handle click outside of user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    
    if (user) {
      await updateUserLanguage(lang);
      toast({
        title: t('common.success'),
        description: t('settings.language') + ' ' + t(`settings.${lang === 'pt' ? 'portuguese' : lang === 'en' ? 'english' : 'spanish'}`),
      });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const getLanguageLabel = () => {
    switch (i18n.language) {
      case 'pt': return 'PT';
      case 'en': return 'EN';
      case 'es': return 'ES';
      default: return 'PT';
    }
  };

  return (
    <nav className="bg-white dark:bg-card shadow-md z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuButtonClick}
              className="inline-flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">{t('common.menu')}</span>
            </Button>
          </div>
          
          {/* Logo */}
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <div className="block lg:hidden h-8 w-auto text-amber text-2xl font-heading font-bold">
                BierServ
              </div>
              <div className="hidden lg:block h-8 w-auto text-amber text-2xl font-heading font-bold">
                BierServ
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <div
                onClick={() => window.location.href = '/dashboard'}
                className="border-transparent hover:border-amber text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer"
              >
                {t('common.dashboard')}
              </div>
              <div
                onClick={() => window.location.href = '/menu'}
                className="border-transparent hover:border-amber text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer transition-all duration-200 hover-lift"
              >
                {t('common.menu')}
              </div>
              <div
                onClick={() => window.location.href = '/tables'}
                className="border-transparent hover:border-amber text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer"
              >
                {t('common.tables')}
              </div>
              <div
                onClick={() => window.location.href = '/orders'}
                className="border-transparent hover:border-amber text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer"
              >
                {t('common.orders')}
              </div>
              {user && (user.role === 'admin' || user.role === 'manager') && (
                <div
                  onClick={() => window.location.href = '/reports'}
                  className="border-transparent hover:border-amber text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer"
                >
                  {t('common.reports')}
                </div>
              )}
            </div>
          </div>
          
          {/* Right side icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-3">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-amber">
                  <Globe className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline-block ml-1">{getLanguageLabel()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.selectLanguage')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleLanguageChange('pt')}>
                  {t('settings.portuguese')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                  {t('settings.english')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('es')}>
                  {t('settings.spanish')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-600 dark:text-gray-300 hover:text-amber">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                  <span className="sr-only">{t('notifications.viewAll')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{t('notifications.viewAll')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-2 py-4 text-center text-gray-500 dark:text-gray-400">
                    {t('common.noData')}
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification: any) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start">
                      <div className="font-medium">{notification.message}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-300 hover:text-amber"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">{t('common.switchTheme')}</span>
            </Button>
            
            {/* Profile Dropdown */}
            <div className="ml-3 relative" ref={userMenuRef}>
              <div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex text-sm rounded-full"
                >
                  <span className="sr-only">{t('common.profile')}</span>
                  <div className="h-8 w-8 rounded-full bg-amber flex items-center justify-center text-white">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Button>
              </div>
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-card border border-border focus:outline-none">
                  <div className="block px-4 py-2 text-sm text-foreground border-b border-border">
                    <div className="font-medium">{user?.username || 'Usuário'}</div>
                    <div className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</div>
                  </div>
                  <div
                    onClick={() => window.location.href = '/user-settings'}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center">
                      Preferências de Usuário
                    </div>
                  </div>
                  
                  {user?.role === 'admin' && (
                    <div
                      onClick={() => window.location.href = '/settings'}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-accent cursor-pointer"
                    >
                      {t('common.settings')}
                    </div>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

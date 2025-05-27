import { Fragment } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  UtensilsCrossed, 
  Users, 
  ClipboardList, 
  FileText, 
  Settings,
  Home 
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Tratamento seguro para o tema
  let theme = 'light';
  let toggleTheme = () => {};
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    // Fallback silencioso
  }

  const menuItems = [
    {
      name: t('common.dashboard'),
      href: '/dashboard',
      icon: Home,
      allowed: true,
      description: 'Visão geral do sistema'
    },
    {
      name: 'Cardápio',
      href: '/menu',
      icon: UtensilsCrossed,
      allowed: true,
      description: 'Gerenciar produtos e categorias'
    },
    {
      name: 'Mesas',
      href: '/tables',
      icon: Users,
      allowed: true,
      description: 'Status e controle de mesas'
    },
    {
      name: 'Pedidos',
      href: '/orders',
      icon: ClipboardList,
      allowed: true,
      description: 'Acompanhar pedidos'
    },
    {
      name: 'Relatórios',
      href: '/reports',
      icon: BarChart3,
      allowed: user && (user.role === 'admin' || user.role === 'manager'),
      description: 'Análises e estatísticas'
    },
    {
      name: 'Configurações',
      href: '/settings',
      icon: Settings,
      allowed: user && user.role === 'admin',
      description: 'Configurações do sistema'
    },
  ];

  const handleNavigation = (href: string) => {
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 flex z-40 md:hidden"
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="transition ease-in-out duration-300 transform"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <Button
                  variant="ghost"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  onClick={onClose}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </Button>
              </div>
            </Transition.Child>

            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center px-6 py-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <div className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  BierServ
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 overflow-y-auto">
              <nav className="space-y-2">
                {menuItems
                  .filter(item => item.allowed)
                  .map((item) => {
                    const isActive = location === item.href || 
                      (item.href !== '/dashboard' && location.startsWith(item.href));
                    
                    return (
                      <Link 
                        key={item.href} 
                        to={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                          "hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md hover:scale-[1.02]",
                          "relative overflow-hidden",
                          isActive 
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25" 
                            : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                        )}
                      >
                        {/* Background glow effect for active item */}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-20 rounded-xl" />
                        )}
                        
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-200",
                          isActive 
                            ? "bg-white/20 text-white" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600 dark:group-hover:text-amber-400"
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{item.name}</div>
                          <div className={cn(
                            "text-xs truncate mt-0.5 transition-colors",
                            isActive 
                              ? "text-white/80" 
                              : "text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                          )}>
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </nav>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold shadow-lg">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {user?.username || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Funcionário'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Transition.Child>

        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </Dialog>
    </Transition>
  );
}

MobileNav.BottomBar = function BottomBar() {
  const { t } = useTranslation();
  const [location] = useLocation();

  const bottomNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Cardápio',
      href: '/menu',
      icon: UtensilsCrossed,
    },
    {
      name: 'Mesas',
      href: '/tables',
      icon: Users,
    },
    {
      name: 'Pedidos',
      href: '/orders',
      icon: ClipboardList,
    },
  ];

  return (
    <div className="flex justify-around py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
      {bottomNavItems.map((item) => {
        const isActive = location === item.href || 
          (item.href !== '/dashboard' && location.startsWith(item.href));
        
        return (
          <Link 
            key={item.name} 
            to={item.href}
            className={cn(
              "flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-20",
              "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95",
              isActive 
                ? "bg-gradient-to-b from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 mb-1",
              isActive 
                ? "bg-white/20 text-white" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            )}>
              <item.icon className="w-4 h-4" />
            </div>
            <span className={cn(
              "text-xs font-medium truncate",
              isActive ? "text-white" : "text-slate-600 dark:text-slate-400"
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

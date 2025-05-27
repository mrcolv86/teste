import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { 
  BarChart3, 
  UtensilsCrossed, 
  Users, 
  ClipboardList, 
  FileText, 
  Settings,
  Home,
  ChevronRight 
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

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

  return (
    <div className={cn(
      "w-64 h-full flex-shrink-0 flex flex-col",
      "bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950",
      "border-r border-slate-200 dark:border-slate-800",
      "shadow-lg",
      className
    )}>
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            BierServ
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems
            .filter(item => item.allowed)
            .map((item) => {
              const isActive = location === item.href || 
                (item.href !== '/dashboard' && location.startsWith(item.href));
              
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
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
                    
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all duration-200 flex-shrink-0",
                      isActive 
                        ? "rotate-90 text-white" 
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )} />
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200 cursor-pointer group">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold shadow-lg">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {user?.username || 'Usuário'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Funcionário'}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

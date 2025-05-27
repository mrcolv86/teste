import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  // Simplificar o uso do tema para evitar erros
  let theme = 'light';
  let toggleTheme = () => {};
  
  try {
    const { theme: currentTheme, toggleTheme: themeToggler } = useTheme();
    theme = currentTheme;
    toggleTheme = themeToggler;
  } catch (error) {
    // Fallback silencioso se o contexto do tema não estiver disponível
  }
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setLocation('/dashboard');
    }
  }, [user, isLoading, setLocation]);
  
  // Handle language change
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className={i18n.language === 'pt' ? 'bg-amber text-white border-amber hover:bg-amber/90 hover:text-white' : ''}
            onClick={() => handleLanguageChange('pt')}
          >
            PT
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={i18n.language === 'en' ? 'bg-amber text-white border-amber hover:bg-amber/90 hover:text-white' : ''}
            onClick={() => handleLanguageChange('en')}
          >
            EN
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={i18n.language === 'es' ? 'bg-amber text-white border-amber hover:bg-amber/90 hover:text-white' : ''}
            onClick={() => handleLanguageChange('es')}
          >
            ES
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="text-gray-600 dark:text-gray-300 hover:text-amber"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">{t('common.switchTheme')}</span>
        </Button>
      </div>
      
      <LoginForm />
      
      <div className="mt-10 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">
          BierServ &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

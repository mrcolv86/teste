import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatedToggle } from "@/components/ui/animated-toggle";
import { useTheme } from "@/providers/ThemeProvider";
import { Moon, Sun, Volume2, VolumeX, Bell, BellOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserPreferencesToggleProps {
  className?: string;
}

export function UserPreferencesToggle({ className }: UserPreferencesToggleProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  
  // Define preference states
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const storedPref = localStorage.getItem("soundEnabled");
    return storedPref ? storedPref === "true" : true;
  });
  
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const storedPref = localStorage.getItem("notificationsEnabled");
    return storedPref ? storedPref === "true" : true;
  });

  // Handle sound toggle
  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    localStorage.setItem("soundEnabled", checked.toString());
    
    // Play a toggle sound if sound is enabled
    if (checked) {
      const audio = new Audio("/sounds/toggle-on.mp3");
      audio.volume = 0.3;
      audio.play().catch(e => console.log("Audio playback prevented:", e));
    }
    
    // Show toast notification
    toast({
      title: checked ? t('preferences.soundOn') : t('preferences.soundOff'),
      description: checked ? t('preferences.soundOnDesc') : t('preferences.soundOffDesc'),
    });
  };

  // Handle notifications toggle
  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem("notificationsEnabled", checked.toString());
    
    // Show toast notification
    toast({
      title: checked ? t('preferences.notificationsOn') : t('preferences.notificationsOff'),
      description: checked ? t('preferences.notificationsOnDesc') : t('preferences.notificationsOffDesc'),
    });
  };

  // Handle theme toggle
  const handleThemeToggle = (checked: boolean) => {
    toggleTheme();
    
    // Show toast notification
    toast({
      title: theme === 'light' ? t('preferences.darkMode') : t('preferences.lightMode'),
      description: theme === 'light' ? t('preferences.darkModeDesc') : t('preferences.lightModeDesc'),
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{t('preferences.userPreferences')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{t('preferences.theme')}</span>
          <AnimatedToggle 
            checked={theme === 'dark'}
            onChange={handleThemeToggle}
            icon={<Sun className="h-3 w-3 text-amber-500" />}
            activeIcon={<Moon className="h-3 w-3 text-indigo-200" />}
            theme="amber"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{t('preferences.sound')}</span>
          <AnimatedToggle 
            checked={soundEnabled}
            onChange={handleSoundToggle}
            icon={<VolumeX className="h-3 w-3 text-gray-500" />}
            activeIcon={<Volume2 className="h-3 w-3 text-green-500" />}
            theme="green"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{t('preferences.notifications')}</span>
          <AnimatedToggle 
            checked={notificationsEnabled}
            onChange={handleNotificationsToggle}
            icon={<BellOff className="h-3 w-3 text-gray-500" />}
            activeIcon={<Bell className="h-3 w-3 text-blue-500" />}
            theme="blue"
          />
        </div>
      </CardContent>
    </Card>
  );
}
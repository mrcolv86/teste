import { useTranslation } from "react-i18next";
import { UserPreferencesToggle } from "@/components/user/UserPreferencesToggle";
import { PushNotificationManager } from "@/components/notifications/PushNotificationManager";
// Usando uma implementação direta para o header da página
const PageHeader = ({ title, description }: { title: string, description?: string }) => (
  <div className="flex flex-col space-y-2 pb-4">
    <h1 className="text-2xl font-bold">{title}</h1>
    {description && <p className="text-muted-foreground">{description}</p>}
  </div>
);
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function UserSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);
  
  if (!user) return null;
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações do Usuário"
        description="Personalize sua experiência no BierServ"
      />
      
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preferences" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UserPreferencesToggle />
            
            <Card className="p-6">
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-medium">{t('preferences.moreOptionsComingSoon')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('preferences.moreOptionsDescription')}
                </p>
              </div>
            </Card>
            
            <PushNotificationManager />
          </div>
        </TabsContent>
        
        <TabsContent value="account">
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('common.comingSoon')}</p>
          </div>
        </TabsContent>
        
        <TabsContent value="appearance">
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('common.comingSoon')}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
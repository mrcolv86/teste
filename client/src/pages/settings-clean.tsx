import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Form schema for brewery settings - Sistema completamente personalizável
const brewerySettingsSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slogan: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  headerLogo: z.string().optional(),
  menuLogo: z.string().optional(),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  defaultLanguage: z.enum(['pt', 'en', 'es']),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  qrMenuTitle: z.string().optional(),
  qrMenuSubtitle: z.string().optional(),
  qrWelcomeMessage: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export default function SettingsClean() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Fetch brewery settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Settings form
  const settingsForm = useForm<z.infer<typeof brewerySettingsSchema>>({
    resolver: zodResolver(brewerySettingsSchema),
    defaultValues: {
      name: '',
      slogan: '',
      description: '',
      logo: '',
      favicon: '',
      headerLogo: '',
      menuLogo: '',
      primaryColor: '#D97706',
      secondaryColor: '#047857',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      defaultLanguage: 'pt',
      phone: '',
      email: '',
      address: '',
      website: '',
      qrMenuTitle: '',
      qrMenuSubtitle: '',
      qrWelcomeMessage: '',
      metaTitle: '',
      metaDescription: '',
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        name: settings.name || '',
        slogan: settings.slogan || '',
        description: settings.description || '',
        logo: settings.logo || '',
        favicon: settings.favicon || '',
        headerLogo: settings.headerLogo || '',
        menuLogo: settings.menuLogo || '',
        primaryColor: settings.primaryColor || '#D97706',
        secondaryColor: settings.secondaryColor || '#047857',
        accentColor: settings.accentColor || '#F59E0B',
        backgroundColor: settings.backgroundColor || '#FFFFFF',
        textColor: settings.textColor || '#1F2937',
        defaultLanguage: settings.defaultLanguage || 'pt',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        website: settings.website || '',
        qrMenuTitle: settings.qrMenuTitle || '',
        qrMenuSubtitle: settings.qrMenuSubtitle || '',
        qrWelcomeMessage: settings.qrWelcomeMessage || '',
        metaTitle: settings.metaTitle || '',
        metaDescription: settings.metaDescription || '',
      });
    }
  }, [settings, settingsForm]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof brewerySettingsSchema>) => {
      return apiRequest('PUT', '/api/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso! O sistema está personalizado para sua cervejaria.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações. Tente novamente.",
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: z.infer<typeof brewerySettingsSchema>) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🎨 Personalização da Cervejaria
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure a identidade visual e informações da sua cervejaria. Essas configurações serão aplicadas em todo o sistema.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        </div>
      ) : (
        <Form {...settingsForm}>
          <form onSubmit={settingsForm.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>🏢 Informações da Cervejaria</CardTitle>
                <CardDescription>
                  Defina o nome, slogan e descrição que aparecerão em todo o sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={settingsForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Cervejaria *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cervejaria Artesanal do Vale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="slogan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slogan</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: A melhor cerveja artesanal da região" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Breve descrição sobre a cervejaria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Identidade Visual */}
            <Card>
              <CardHeader>
                <CardTitle>🎨 Identidade Visual</CardTitle>
                <CardDescription>
                  Configure logotipos e cores que definem a identidade da cervejaria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={settingsForm.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Principal</FormLabel>
                      <FormControl>
                        <Input placeholder="URL do logo principal (dashboard/sistema)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="menuLogo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo do Menu QR</FormLabel>
                      <FormControl>
                        <Input placeholder="URL do logo para menu QR (clientes)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={settingsForm.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor Primária</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <div 
                            className="w-12 h-10 rounded border shadow-sm"
                            style={{ backgroundColor: field.value }}
                          ></div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor Secundária</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <div 
                            className="w-12 h-10 rounded border shadow-sm"
                            style={{ backgroundColor: field.value }}
                          ></div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor de Destaque</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <div 
                            className="w-12 h-10 rounded border shadow-sm"
                            style={{ backgroundColor: field.value }}
                          ></div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações de Contato */}
            <Card>
              <CardHeader>
                <CardTitle>📞 Informações de Contato</CardTitle>
                <CardDescription>
                  Dados que aparecerão no menu QR para os clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={settingsForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="contato@cervejaria.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.cervejaria.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua das Cervejarias, 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações do Menu QR */}
            <Card>
              <CardHeader>
                <CardTitle>📱 Personalização do Menu QR</CardTitle>
                <CardDescription>
                  Configure como o menu digital aparecerá para seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={settingsForm.control}
                  name="qrMenuTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Menu</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cardápio Digital" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="qrMenuSubtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtítulo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Faça seu pedido diretamente pela mesa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="qrWelcomeMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Boas-vindas</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Seja bem-vindo à nossa cervejaria!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="defaultLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idioma Padrão</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o idioma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pt">Português</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                      Salvando Configurações...
                    </>
                  ) : (
                    <>
                      🎨 Salvar Personalização da Cervejaria
                    </>
                  )}
                </Button>
                <p className="text-sm text-center text-amber-700 dark:text-amber-300 mt-3">
                  As configurações serão aplicadas imediatamente em todo o sistema
                </p>
              </CardContent>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
}
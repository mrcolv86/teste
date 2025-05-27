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
import { Settings2, Palette, Globe, Users, UserPlus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { ImageUpload } from '@/components/ui/image-upload';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Form schema for brewery settings
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
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

// Form schema for users
const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(['admin', 'manager', 'waiter', 'kitchen']),
  language: z.enum(['pt', 'en', 'es']),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});

export default function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Fetch brewery settings
  const { data: settings = {}, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // User form
  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      role: 'waiter',
      language: 'pt',
      password: '',
    },
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
      metaTitle: '',
      metaDescription: '',
    },
  });

  // Update settings when data loads
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
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
        metaTitle: settings.metaTitle || '',
        metaDescription: settings.metaDescription || '',
      });
    }
  }, [settings, settingsForm]);

  // User mutations
  const userMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingUser) {
        return apiRequest('PATCH', `/api/users/${editingUser.id}`, data);
      } else {
        return apiRequest('POST', '/api/users', data);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar usuário',
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso!',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir usuário',
        variant: 'destructive',
      });
    },
  });

  // Settings mutation
  const settingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof brewerySettingsSchema>) => {
      return apiRequest('PATCH', '/api/settings', data);
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    },
  });

  // User submit function
  const onUserSubmit = (data: z.infer<typeof userSchema>) => {
    const submitData = editingUser ? 
      { ...data, password: undefined } : // Don't send password on update
      data;
    userMutation.mutate(submitData);
  };

  const onSettingsSubmit = (data: z.infer<typeof brewerySettingsSchema>) => {
    settingsMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('settings.description')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            {t('settings.general')}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('settings.appearance')}
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.localization')}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('settings.users')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.generalSettings')}</CardTitle>
              <CardDescription>
                {t('settings.generalSettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={settingsForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.breweryName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('settings.breweryName')} {...field} />
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
                            <Input placeholder="Slogan da cervejaria" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={settingsForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Descrição da cervejaria" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contato@cervejaria.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={settingsForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Endereço completo" {...field} />
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

                  <Button 
                    type="submit" 
                    disabled={settingsMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {settingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência da sua aplicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Logos e Imagens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={settingsForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              value={field.value || ''}
                              onChange={field.onChange}
                              label="Logo Principal"
                              placeholder="URL do logo principal"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="headerLogo"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              value={field.value || ''}
                              onChange={field.onChange}
                              label="Logo do Cabeçalho"
                              placeholder="URL do logo para cabeçalho"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="menuLogo"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              value={field.value || ''}
                              onChange={field.onChange}
                              label="Logo do Menu QR"
                              placeholder="URL do logo para menu QR"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="favicon"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              value={field.value || ''}
                              onChange={field.onChange}
                              label="Favicon"
                              placeholder="URL do favicon (.ico)"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cores</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <FormField
                        control={settingsForm.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor Primária</FormLabel>
                            <FormControl>
                              <div className="flex space-x-2">
                                <Input type="color" className="w-12 h-10" {...field} />
                                <Input placeholder="#D97706" {...field} />
                              </div>
                            </FormControl>
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
                            <FormControl>
                              <div className="flex space-x-2">
                                <Input type="color" className="w-12 h-10" {...field} />
                                <Input placeholder="#047857" {...field} />
                              </div>
                            </FormControl>
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
                            <FormControl>
                              <div className="flex space-x-2">
                                <Input type="color" className="w-12 h-10" {...field} />
                                <Input placeholder="#F59E0B" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={settingsMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {settingsMutation.isPending ? 'Salvando...' : 'Salvar Aparência'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Localização</CardTitle>
              <CardDescription>
                Configure idioma e informações regionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={settingsForm.control}
                      name="metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título SEO</FormLabel>
                          <FormControl>
                            <Input placeholder="Título para SEO" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição SEO</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrição para SEO" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={settingsMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {settingsMutation.isPending ? 'Salvando...' : 'Salvar Localização'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>
                    Gerencie os usuários que têm acesso ao sistema
                  </CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingUser ? 'Atualize as informações do usuário' : 'Adicione um novo usuário ao sistema'}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                        <FormField
                          control={userForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do usuário" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome de Usuário</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@exemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Função</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma função" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="manager">Gerente</SelectItem>
                                  <SelectItem value="waiter">Garçom</SelectItem>
                                  <SelectItem value="kitchen">Cozinha</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {!editingUser && (
                          <FormField
                            control={userForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Senha do usuário" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={userForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Idioma</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um idioma" />
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
                        
                        <div className="flex gap-2">
                          <Button type="submit" disabled={userMutation.isPending}>
                            {userMutation.isPending ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsUserDialogOpen(false);
                              setEditingUser(null);
                              userForm.reset();
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {users?.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || user.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{user.name || user.username}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'manager' ? 'secondary' : 'outline'}>
                              {user.role === 'admin' ? 'Administrador' : 
                               user.role === 'manager' ? 'Gerente' :
                               user.role === 'waiter' ? 'Garçom' : 'Cozinha'}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {user.language === 'pt' ? 'Português' : user.language === 'en' ? 'English' : 'Español'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            userForm.reset({
                              name: user.name || '',
                              username: user.username,
                              email: user.email || '',
                              role: user.role,
                              language: user.language || 'pt'
                            });
                            setIsUserDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o usuário "{user.name || user.username}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!users?.length && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Adicione o primeiro usuário ao sistema.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, FileText, Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { insertProductSchema, insertCategorySchema } from '@shared/schema';
import { MenuFilters } from '@/components/menu/MenuFilters';
import { MenuCategory } from '@/components/menu/MenuCategory';
import { TagInput } from '@/components/ui/tag-input';
import { ImageUpload } from '@/components/ui/image-upload';
import { exportMenuToPDF, exportCompactMenuToPDF } from '@/utils/menuPdfExport';

const productFormSchema = insertProductSchema.extend({
  categoryId: z.number().min(1, 'Categoria é obrigatória'),
  price: z.coerce.number().min(0.01, 'Preço deve ser maior que 0'),
  ibu: z.coerce.number().optional(),
  abv: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  pairings: z.array(z.string()).optional(),
});

const categoryFormSchema = insertCategorySchema.extend({
  displayOrder: z.coerce.number().min(0, 'Ordem deve ser 0 ou maior'),
});

export default function MenuPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [abvRange, setAbvRange] = useState<[number, number]>([0, 100]);
  const [ibuRange, setIbuRange] = useState<[number, number]>([0, 1000]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [productVariations, setProductVariations] = useState<Array<{
    name: string;
    priceAdjustment: number;
    description: string;
  }>>([]);

  // Fetch data
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/current'],
  });

  const { data: brewerySettings } = useQuery({
    queryKey: ['/api/settings'],
  });

  const { data: pairingSuggestions } = useQuery({
    queryKey: ['/api/pairing-suggestions'],
  });

  const isManager = (currentUser as any)?.role === 'admin' || (currentUser as any)?.role === 'manager';
  
  // Debug: log user data to see what's happening
  console.log('Current User data:', currentUser);
  console.log('Is manager:', isManager);

  // Forms
  const productForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: 0,
      ibu: undefined,
      abv: undefined,
      image: '',
      pairings: [],
      weight: undefined,
      servingSize: '',
      isActive: true,
    },
  });

  const categoryForm = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      icon: '',
      displayOrder: 0,
    },
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pairing-suggestions'] });
      setIsAddProductOpen(false);
      productForm.reset();
      setProductVariations([]);
      toast({
        title: t('common.success'),
        description: t('menu.productCreated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('menu.productCreateError'),
        variant: 'destructive',
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsAddCategoryOpen(false);
      categoryForm.reset();
      toast({
        title: t('common.success'),
        description: t('menu.categoryCreated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('menu.categoryCreateError'),
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const onProductSubmit = (data: any) => {
    // Clean and prepare data for submission
    const cleanData = {
      ...data,
      price: parseFloat(data.price) || 0,
      categoryId: parseInt(data.categoryId) || 0,
      weight: data.weight ? parseInt(data.weight) : null,
      ibu: data.ibu ? parseFloat(data.ibu) : null,
      abv: data.abv ? parseFloat(data.abv) : null,
      isActive: data.isActive ?? true,
      pairings: data.pairings || [],
      variations: productVariations.filter(v => v.name.trim() !== ''),
    };
    
    console.log('Enviando dados do produto:', cleanData);
    createProductMutation.mutate(cleanData);
  };

  const onCategorySubmit = (data: any) => {
    createCategoryMutation.mutate(data);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchTerm('');
    setSortBy('name');
    setFilterAvailable(false);
    setAbvRange([0, 100]);
    setIbuRange([0, 1000]);
  };

  const handleAbvChange = (range: number[]) => {
    setAbvRange([range[0], range[1]]);
  };

  const handleIbuChange = (range: number[]) => {
    setIbuRange([range[0], range[1]]);
  };

  const handleExportPDF = () => {
    if (categories && products && brewerySettings) {
      exportMenuToPDF(categories as any[], products as any[], brewerySettings as any);
    }
  };

  const handleExportCompactPDF = () => {
    if (categories && products && brewerySettings) {
      exportCompactMenuToPDF(categories as any[], products as any[], brewerySettings as any);
    }
  };

  // Filter products
  const filteredProducts = products ? (products as any[]).filter((product) => {
    if (selectedCategory && product.categoryId !== selectedCategory) return false;
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterAvailable && !product.available) return false;
    if (product.abv !== null && product.abv !== undefined && (product.abv < abvRange[0] || product.abv > abvRange[1])) return false;
    if (product.ibu !== null && product.ibu !== undefined && (product.ibu < ibuRange[0] || product.ibu > ibuRange[1])) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'category':
        return a.categoryId - b.categoryId;
      default:
        return a.name.localeCompare(b.name);
    }
  }) : [];

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    if (!acc[product.categoryId]) {
      acc[product.categoryId] = [];
    }
    acc[product.categoryId].push(product);
    return acc;
  }, {} as Record<number, any[]>);

  if (categoriesLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            {t('common.menu')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('menu.manageMenu')}
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button 
            onClick={handleExportPDF}
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Cardápio PDF
          </Button>
          
          <Button 
            onClick={handleExportCompactPDF}
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF Compacto
          </Button>
          
          {isManager && (
            <>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber hover:bg-amber/90 text-white btn-interactive">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('menu.addProduct')}</DialogTitle>
                  </DialogHeader>
                  <Form {...productForm}>
                    <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={productForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">{t('menu.name')}</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={productForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">{t('menu.price')}</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={productForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t('menu.category')}</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder={t('menu.selectCategory')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(categories as any[])?.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{t('menu.description')}</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="min-h-[60px] text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={productForm.control}
                          name="ibu"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">IBU</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={productForm.control}
                          name="abv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">ABV (%)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={productForm.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Peso (g)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="300" {...field} className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={productForm.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Imagem do Produto</FormLabel>
                            <FormControl>
                              <ImageUpload
                                value={field.value || ''}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="pairings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Harmonizações</FormLabel>
                            <FormControl>
                              <TagInput
                                tags={field.value || []}
                                onTagsChange={field.onChange}
                                placeholder="Digite uma harmonização e pressione Enter"
                                suggestions={(pairingSuggestions as any[])?.map(s => s.name) || []}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Variações do Produto */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">Variações do Produto</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setProductVariations([...productVariations, { name: '', priceAdjustment: 0, description: '' }])}
                            className="h-8"
                          >
                            Adicionar Variação
                          </Button>
                        </div>
                        
                        {productVariations.map((variation, index) => (
                          <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Variação {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setProductVariations(productVariations.filter((_, i) => i !== index))}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-600">Nome da Variação</label>
                                <Input
                                  placeholder="Ex: 350ml, 500ml, Individual"
                                  value={variation.name}
                                  onChange={(e) => {
                                    const updated = [...productVariations];
                                    updated[index].name = e.target.value;
                                    setProductVariations(updated);
                                  }}
                                  className="h-8"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-gray-600">Ajuste no Preço (R$)</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={variation.priceAdjustment}
                                  onChange={(e) => {
                                    const updated = [...productVariations];
                                    updated[index].priceAdjustment = parseFloat(e.target.value) || 0;
                                    setProductVariations(updated);
                                  }}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-600">Descrição</label>
                              <Input
                                placeholder="Ex: Tamanho individual, Perfeito para compartilhar"
                                value={variation.description}
                                onChange={(e) => {
                                  const updated = [...productVariations];
                                  updated[index].description = e.target.value;
                                  setProductVariations(updated);
                                }}
                                className="h-8"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsAddProductOpen(false);
                            productForm.reset();
                            setProductVariations([]);
                          }} 
                          className="h-9"
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={createProductMutation.isPending} className="h-9">
                          {createProductMutation.isPending ? 'Salvando...' : t('common.save')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="btn-interactive">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('menu.addCategory')}</DialogTitle>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('menu.name')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={categoryForm.control}
                        name="displayOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('menu.displayOrder')}</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button type="submit">{t('common.save')}</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <MenuFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories as any[]}
        abvRange={abvRange}
        onAbvChange={handleAbvChange}
        ibuRange={ibuRange}
        onIbuChange={handleIbuChange}
      />
      
      {/* Content */}
      <div className="space-y-8">
        {categories && Object.keys(productsByCategory).length > 0 ? (
          Object.entries(productsByCategory).map(([categoryId, products]: [string, any]) => {
            const category = (categories as any[]).find(c => c.id === parseInt(categoryId));
            return category ? (
              <MenuCategory 
                key={categoryId} 
                category={category} 
                products={products} 
              />
            ) : null;
          })
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || selectedCategory ? 'Nenhum produto encontrado' : t('common.noData')}
            </h3>
            {(searchTerm || selectedCategory) && (
              <Button variant="outline" onClick={handleResetFilters} className="mt-4">
                Limpar Filtros
              </Button>
            )}
            <p className="text-gray-500 dark:text-gray-400">{t('menu.addProduct')}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
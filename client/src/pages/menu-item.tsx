import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Pencil, ArrowLeft, ThumbsUp, ThumbsDown, Trash } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Form schema for review
const reviewFormSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(1, {
    message: "Comment is required",
  }),
});

// Form schema for product edit
const productEditFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string(),
  price: z.coerce.number().positive({
    message: "Price must be a positive number.",
  }),
  categoryId: z.coerce.number({
    required_error: "Category is required.",
  }),
  ibu: z.coerce.number().optional(),
  abv: z.coerce.number().optional(),
  image: z.string().optional(),
  pairings: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function MenuItemPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const isManager = user && (user.role === 'admin' || user.role === 'manager');
  
  // Fetch product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/products/${id}`],
  });
  
  // Fetch product reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/product-reviews?productId=${id}&approved=true`],
  });
  
  // Fetch categories for editing
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    enabled: isManager,
  });
  
  // Mutations
  const addReviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewFormSchema>) => {
      return apiRequest('POST', '/api/product-reviews', {
        ...data,
        productId: parseInt(id),
      });
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('productReviews.addReview') + ' ' + t('common.success').toLowerCase(),
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/product-reviews?productId=${id}&approved=true`] });
      reviewForm.reset();
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('productReviews.addReview') + ' ' + t('common.error').toLowerCase(),
        variant: 'destructive',
      });
    },
  });
  
  const updateProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productEditFormSchema>) => {
      // Convert pairings string to array
      const pairings = data.pairings 
        ? data.pairings.split(',').map(p => p.trim()) 
        : [];
      
      const productData = {
        ...data,
        pairings,
      };
      
      return apiRequest('PUT', `/api/products/${id}`, productData);
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('menu.editProduct') + ' ' + t('common.success').toLowerCase(),
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('menu.editProduct') + ' ' + t('common.error').toLowerCase(),
        variant: 'destructive',
      });
    },
  });
  
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/products/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('menu.deleteProduct') + ' ' + t('common.success').toLowerCase(),
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setLocation('/menu');
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('menu.deleteProduct') + ' ' + t('common.error').toLowerCase(),
        variant: 'destructive',
      });
    },
  });
  
  // Review form
  const reviewForm = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      comment: '',
    },
  });
  
  // Product edit form
  const productEditForm = useForm<z.infer<typeof productEditFormSchema>>({
    resolver: zodResolver(productEditFormSchema),
  });
  
  // Initialize edit form with product data
  const handleEditProduct = () => {
    if (product) {
      productEditForm.reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        categoryId: product.categoryId,
        ibu: product.ibu,
        abv: product.abv,
        image: product.image || '',
        pairings: product.pairings ? product.pairings.join(', ') : '',
        isActive: product.isActive,
      });
      setIsEditDialogOpen(true);
    }
  };
  
  // Handle form submissions
  const onReviewSubmit = (data: z.infer<typeof reviewFormSchema>) => {
    addReviewMutation.mutate(data);
  };
  
  const onProductEditSubmit = (data: z.infer<typeof productEditFormSchema>) => {
    updateProductMutation.mutate(data);
  };
  
  const handleDeleteProduct = () => {
    if (confirm(t('common.confirmDelete'))) {
      deleteProductMutation.mutate();
    }
  };
  
  // Helper functions
  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };
  
  // Get translated name and description if available
  const getName = () => {
    if (product?.translations && product.translations[i18n.language]) {
      return product.translations[i18n.language].name || product.name;
    }
    return product?.name || '';
  };
  
  const getDescription = () => {
    if (product?.translations && product.translations[i18n.language]) {
      return product.translations[i18n.language].description || product.description;
    }
    return product?.description || '';
  };
  
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-amber fill-amber' : 'text-gray-300 dark:text-gray-600'}`} 
      />
    ));
  };
  
  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">{t('common.notFound')}</h2>
        <Button variant="outline" onClick={() => setLocation('/menu')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.goBack')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => setLocation('/menu')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.menu')}
        </Button>
      </div>
      
      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
            <img 
              src={product.image || 'https://placehold.co/400x300/e2e8f0/1e293b?text=No+Image'} 
              alt={getName()} 
              className="w-full h-64 object-cover"
            />
          </div>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-beer">{getName()}</CardTitle>
                  {product.categoryId && (
                    <CardDescription>
                      {categories.find((c: any) => c.id === product.categoryId)?.name}
                    </CardDescription>
                  )}
                </div>
                <Badge className="px-3 py-1 text-base bg-amber/10 text-amber">
                  {formatCurrency(product.price)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {(product.ibu || product.abv) && (
                <div className="flex gap-3 my-2">
                  {product.ibu && (
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      IBU: {product.ibu}
                    </Badge>
                  )}
                  {product.abv && (
                    <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      ABV: {product.abv}%
                    </Badge>
                  )}
                </div>
              )}
              
              <p className="text-gray-700 dark:text-gray-300">{getDescription()}</p>
              
              {product.pairings && product.pairings.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase mb-1">
                    {t('customer.pairingWith')}:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {product.pairings.map((pairing: string, index: number) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        {pairing}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            {isManager && (
              <CardFooter className="flex justify-end gap-2 pt-0">
                <Button variant="outline" onClick={handleEditProduct}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </Button>
                <Button variant="destructive" onClick={handleDeleteProduct}>
                  <Trash className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      {/* Tabs for Details and Reviews */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            {t('orders.orderDetails')}
          </TabsTrigger>
          <TabsTrigger value="reviews">
            {t('productReviews.customerReviews')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('orders.orderDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t('menu.category')}</h4>
                  <p>{categories.find((c: any) => c.id === product.categoryId)?.name}</p>
                </div>
                {product.ibu && (
                  <div>
                    <h4 className="font-medium mb-2">IBU</h4>
                    <p>{product.ibu}</p>
                  </div>
                )}
                {product.abv && (
                  <div>
                    <h4 className="font-medium mb-2">ABV</h4>
                    <p>{product.abv}%</p>
                  </div>
                )}
                {product.pairings && product.pairings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t('menu.pairings')}</h4>
                    <p>{product.pairings.join(', ')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('productReviews.customerReviews')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReviews ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                      <div className="flex items-center mb-2">
                        <div className="flex mr-2">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                  {t('common.noData')}
                </p>
              )}
              
              {/* Add Review Form */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium mb-3">{t('productReviews.addReview')}</h3>
                <Form {...reviewForm}>
                  <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                    <FormField
                      control={reviewForm.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{t('productReviews.rating')}:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <FormControl key={rating}>
                                  <button
                                    type="button"
                                    onClick={() => field.onChange(rating)}
                                    className="focus:outline-none"
                                  >
                                    <Star 
                                      className={`h-5 w-5 ${
                                        rating <= field.value ? 'text-amber fill-amber' : 'text-gray-300 dark:text-gray-600'
                                      }`} 
                                    />
                                  </button>
                                </FormControl>
                              ))}
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={reviewForm.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder={t('productReviews.comment')} 
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={addReviewMutation.isPending}
                    >
                      {addReviewMutation.isPending ? t('common.loading') : t('productReviews.addReview')}
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('menu.editProduct')}</DialogTitle>
          </DialogHeader>
          <Form {...productEditForm}>
            <form onSubmit={productEditForm.handleSubmit(onProductEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productEditForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t('menu.name')} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productEditForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder={t('menu.price')} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={productEditForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder={t('menu.description')} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={productEditForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('menu.category')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productEditForm.control}
                  name="ibu"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" placeholder="IBU" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productEditForm.control}
                  name="abv"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="ABV (%)" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={productEditForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder={t('menu.image') + " URL"} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={productEditForm.control}
                name="pairings"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder={t('menu.pairings')} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

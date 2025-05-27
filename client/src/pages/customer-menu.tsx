import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerOrder } from '@/components/customer/CustomerOrder';
import { useWebSocket } from '@/lib/websocket';
import { ShoppingCart, Bell, Languages, Plus, Minus, Search, Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TableData {
  id: number;
  number: number;
  status: string;
}

interface SettingsData {
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

interface CategoryData {
  id: number;
  name: string;
  icon: string;
}

interface ProductData {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
  abv: number;
  ibu: number;
  pairings: string[];
  isActive: boolean;
}

export default function CustomerMenu() {
  const { tableId } = useParams<{ tableId: string }>();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { joinTable, callWaiter } = useWebSocket();
  
  // State
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  
  // Fetch table data
  const { data: table, isLoading: isLoadingTable } = useQuery({
    queryKey: [`/api/tables/number/${tableId}`]
  });
  
  // Fetch brewery settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });
  
  // Type assertions for data with safety checks
  const tableData = table as TableData;
  const settingsData = settings as SettingsData;
  const categoriesData = (categories || []) as CategoryData[];
  const productsData = (products || []) as ProductData[];
  
  // Join table socket when table is loaded
  useEffect(() => {
    if (tableData?.id) {
      joinTable(tableData.id);
    }
  }, [tableData, joinTable]);
  
  // Filter products - only show active products
  const filteredProducts = Array.isArray(productsData) ? productsData.filter((product: ProductData) => {
    // Only show active products - note: backend returns isActive correctly
    if (!product || !product.isActive) {
      return false;
    }
    
    // Category filter
    if (selectedCategory !== null && product.categoryId !== selectedCategory) {
      return false;
    }
    
    // Search filter
    if (searchTerm && product.name && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }) : [];
  
  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc: any, product: any) => {
    const categoryId = product.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(product);
    return acc;
  }, {});
  
  // Add product to cart
  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingProduct = prevCart.find(item => item.productId === product.id);
      
      if (existingProduct) {
        return prevCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [
          ...prevCart, 
          { 
            productId: product.id, 
            name: product.name, 
            price: product.price,
            quantity: 1,
          }
        ];
      }
    });
    
    toast({
      title: t('customer.addToCart'),
      description: product.name,
    });
  };
  
  // Remove product from cart
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };
  
  // Update quantity in cart
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };
  
  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  // Handle language change
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  
  // Handle waiter call
  const handleCallWaiter = () => {
    if (tableData?.id) {
      callWaiter(tableData.id);
      toast({
        title: "Garçom Chamado!",
        description: "O garçom foi notificado e virá atendê-lo em breve.",
      });
    }
  };
  
  if (isLoadingTable) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!table) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <h1 className="text-2xl font-bold mb-4">{t('customer.tableNotFound')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {t('customer.tableNotFoundDescription')}
        </p>
        <Button onClick={() => setLocation('/')}>
          {t('common.goBack')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header with brewery branding - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Brewery Logo and Name */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm sm:text-xl">🍺</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl font-bold text-foreground truncate" style={{ color: settingsData?.primaryColor || '#D97706' }}>
                  {settingsData?.name || 'BierServ'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Mesa {tableData?.number}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {/* Language Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2 sm:h-10 sm:px-3 border-amber/30 hover:border-amber">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-sm sm:text-lg">
                        {i18n.language === 'pt' && '🇧🇷'}
                        {i18n.language === 'en' && '🇺🇸'}
                        {i18n.language === 'es' && '🇪🇸'}
                      </span>
                      <span className="hidden sm:inline text-xs font-medium uppercase">
                        {i18n.language}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-44 p-2">
                  <div className="space-y-1">
                    <button 
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors ${
                        i18n.language === 'pt' ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleLanguageChange('pt')}
                    >
                      <span className="text-lg">🇧🇷</span>
                      <span className="text-sm font-medium">Português</span>
                      {i18n.language === 'pt' && <span className="ml-auto text-primary">✓</span>}
                    </button>
                    <button 
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors ${
                        i18n.language === 'en' ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleLanguageChange('en')}
                    >
                      <span className="text-lg">🇺🇸</span>
                      <span className="text-sm font-medium">English</span>
                      {i18n.language === 'en' && <span className="ml-auto text-primary">✓</span>}
                    </button>
                    <button 
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors ${
                        i18n.language === 'es' ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleLanguageChange('es')}
                    >
                      <span className="text-lg">🇪🇸</span>
                      <span className="text-sm font-medium">Español</span>
                      {i18n.language === 'es' && <span className="ml-auto text-primary">✓</span>}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Call Waiter Button - Elegant and centered */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCallWaiter}
                className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 text-orange-700 hover:from-orange-100 hover:to-amber-100 hover:border-orange-400 px-4 py-2 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 rounded-full h-10"
              >
                <Bell className="h-4 w-4 mr-2" />
                {t('customer.callWaiter')}
              </Button>
              
              {/* Cart Button */}
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="default" size="sm" className="relative h-8 px-2 sm:h-10 sm:px-4">
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Carrinho</span>
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 px-1 py-0 min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 bg-red-500 text-white text-xs">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <CustomerOrder 
                    cart={cart}
                    tableId={parseInt(tableId!)}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                    clearCart={clearCart}
                    onClose={() => setCartOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Table Info Bar - Discreto */}
          <div className="flex justify-end pb-2 pr-4">
            <span className="text-xs text-muted-foreground/70 bg-muted/30 px-2 py-1 rounded-full">
              Mesa {tableData?.number}
            </span>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories Card */}
        <Card className="mb-8 shadow-sm border-border">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Categorias</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`p-2 sm:p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  selectedCategory === null 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🍽️</div>
                <div className="font-medium text-xs sm:text-sm">Todos</div>
              </button>
              {categoriesData.map((category: CategoryData) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-2 sm:p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                    selectedCategory === category.id 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <div className="text-lg sm:text-2xl mb-1 sm:mb-2">
                    {category.icon === 'beer' && '🍺'}
                    {category.icon === 'utensils' && '🍽️'}
                    {category.icon === 'dish' && '🍽️'}
                    {category.icon === 'glass' && '🥤'}
                  </div>
                  <div className="font-medium text-xs sm:text-sm">{category.name}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Busque no cardápio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingCategories || isLoadingProducts ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="h-80 animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredProducts.map((product: any) => {
              if (!product || !product.id) return null;
              
              const cartItem = cart.find(item => item.productId === product.id);
              const quantity = cartItem?.quantity || 0;
              
              return (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/60 overflow-hidden">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🍺
                      </div>
                    )}
                    
                    {/* Beer Info Badges */}
                    {(product.abv || product.ibu) && (
                      <div className="absolute top-2 left-2 space-x-1">
                        {product.abv && (
                          <Badge variant="secondary" className="text-xs">
                            {product.abv}% ABV
                          </Badge>
                        )}
                        {product.ibu && (
                          <Badge variant="secondary" className="text-xs">
                            {product.ibu} IBU
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Price and Add to Cart */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      
                      {quantity === 0 ? (
                        <Button 
                          onClick={() => addToCart(product)}
                          size="sm"
                          className="transition-all duration-200 hover:scale-105"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Pedir
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium min-w-[20px] text-center">{quantity}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Pairings */}
                    {product.pairings && product.pairings.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Harmoniza com:</strong> {(() => {
                          try {
                            if (Array.isArray(product.pairings)) {
                              return product.pairings.join(', ');
                            } else if (typeof product.pairings === 'string') {
                              const parsed = JSON.parse(product.pairings);
                              return Array.isArray(parsed) ? parsed.join(', ') : product.pairings;
                            }
                            return '';
                          } catch {
                            return typeof product.pairings === 'string' ? product.pairings : '';
                          }
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
          
          {/* Show message only if no products after loading */}
          {!isLoadingCategories && !isLoadingProducts && filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🍺</div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm || selectedCategory ? 'Nenhum produto encontrado' : 'Cardápio em breve!'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory ? 'Tente remover os filtros para ver mais produtos.' : 'Estamos preparando nossos deliciosos produtos.'}
              </p>
              {(searchTerm || selectedCategory) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory(null);
                  }}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Fixed Cart Button - Only when items in cart */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <Button 
            className="px-8 py-4 rounded-full shadow-lg text-lg font-medium animate-bounce"
            onClick={() => setCartOpen(true)}
            size="lg"
            style={{ backgroundColor: settingsData?.primaryColor || '#D97706' }}
          >
            <ShoppingCart className="mr-3 h-5 w-5" />
            {cartItemCount} {cartItemCount === 1 ? t('orders.item') : t('orders.items')} • {formatCurrency(cartTotal)}
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SalesChart } from '@/components/reports/SalesChart';
import { TopProductsChart } from '@/components/reports/TopProductsChart';
import { generatePDFReport } from '@/utils/pdfExport';

export default function Reports() {
  const { t } = useTranslation();
  
  // State
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  
  const [reportType, setReportType] = useState('sales');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Fetch orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });
  
  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Fetch order items for each order
  const { data: orderDetails = [], isLoading: isLoadingOrderDetails } = useQuery({
    queryKey: ['/api/orders'],
    select: (data) => {
      return data.filter((order: any) => order.items && order.items.length > 0);
    },
  });
  
  // Filter orders by date range
  const getFilteredOrders = () => {
    if (!dateRange.from || !dateRange.to) return orders;
    
    return orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  };
  
  // Calculate totals
  const calculateTotals = () => {
    const filteredOrders = getFilteredOrders();
    
    const totalSales = filteredOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((order: any) => order.status === 'completed').length;
    
    // Calculate items sold
    let totalItemsSold = 0;
    filteredOrders.forEach((order: any) => {
      if (order.items) {
        totalItemsSold += order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      }
    });
    
    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    return {
      totalSales,
      totalOrders,
      completedOrders,
      totalItemsSold,
      averageOrderValue,
    };
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange.from) return '';
    
    if (!dateRange.to) {
      return format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
    }
    
    return `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`;
  };
  
  // Prepare sales by category data
  const getSalesByCategory = () => {
    const filteredOrders = getFilteredOrders();
    const salesByCategory: Record<string, number> = {};
    
    filteredOrders.forEach((order: any) => {
      if (!order.items) return;
      
      order.items.forEach((item: any) => {
        const product = products.find((p: any) => p.id === item.productId);
        if (!product) return;
        
        const category = categories.find((c: any) => c.id === product.categoryId);
        if (!category) return;
        
        const categoryName = category.name;
        
        if (!salesByCategory[categoryName]) {
          salesByCategory[categoryName] = 0;
        }
        
        salesByCategory[categoryName] += item.price * item.quantity;
      });
    });
    
    return Object.entries(salesByCategory).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  // Get top selling products
  const getTopProducts = (limit = 5) => {
    const productSales: Record<number, { count: number; revenue: number }> = {};
    
    const filteredOrders = getFilteredOrders();
    
    filteredOrders.forEach((order: any) => {
      if (!order.items) return;
      
      order.items.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { count: 0, revenue: 0 };
        }
        
        productSales[item.productId].count += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    
    const topProducts = Object.entries(productSales)
      .map(([productId, { count, revenue }]) => {
        const product = products.find((p: any) => p.id === parseInt(productId));
        return {
          id: parseInt(productId),
          name: product ? product.name : `Product ${productId}`,
          count,
          revenue,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return topProducts;
  };
  
  // Prepare sales by hour data
  const getSalesByHour = () => {
    const salesByHour: Record<number, number> = {};
    
    // Initialize hours
    for (let i = 0; i < 24; i++) {
      salesByHour[i] = 0;
    }
    
    const filteredOrders = getFilteredOrders();
    
    filteredOrders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      
      salesByHour[hour] += order.totalAmount;
    });
    
    return Object.entries(salesByHour).map(([hour, value]) => ({
      hour: parseInt(hour),
      value,
    }));
  };
  
  // Handle print report
  const handlePrintReport = () => {
    window.print();
  };
  
  // Handle export report as PDF
  const handleExportReport = async () => {
    const totals = calculateTotals();
    const topProducts = getTopProducts();
    const salesByCategory = getSalesByCategory();
    
    const reportData = {
      dateRange: formatDateRange(),
      totals,
      topProducts,
      salesByCategory,
    };
    
    try {
      await generatePDFReport(reportData);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback para exportação JSON se o PDF falhar
      const jsonString = JSON.stringify(reportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
      
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `report-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Calculate totals
  const totals = calculateTotals();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            {t('common.reports')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Relatórios de vendas
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left sm:w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange() || 'Selecionar período'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range) {
                    setDateRange({
                      from: range.from,
                      to: range.to
                    });
                  } else {
                    setDateRange({ from: undefined, to: undefined });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar como PDF
            </Button>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalSales)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Todos os Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pedidos Finalizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.completedOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Itens Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalItemsSold}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Valor médio do pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.averageOrderValue)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="sales">Visão Geral de Vendas</TabsTrigger>
            <TabsTrigger value="categories">Vendas por categorias</TabsTrigger>
            <TabsTrigger value="products">Produtos mais vendidos</TabsTrigger>
          </TabsList>
          
          {reportType === 'categories' && (
            <Select
              value={categoryFilter || 'all'}
              onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {(categories as any[])?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <TabsContent value="sales" className="mt-0">
              <SalesChart 
                data={getSalesByHour()} 
                title="Vendas por Hora"
                isLoading={isLoadingOrders}
              />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-0">
              <div className="h-[400px]">
                {isLoadingOrders || isLoadingProducts || isLoadingCategories ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : getSalesByCategory().length > 0 ? (
                  <SalesChart 
                    data={getSalesByCategory()} 
                    title="Vendas por Categoria"
                    isLoading={false}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="mt-0">
              <TopProductsChart 
                data={getTopProducts(10)} 
                title="Produtos Mais Vendidos"
                isLoading={isLoadingOrders || isLoadingProducts}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

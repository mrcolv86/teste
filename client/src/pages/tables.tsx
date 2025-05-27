import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Grid3X3, GridIcon, MapPin } from 'lucide-react';
import { TableCard } from '@/components/tables/TableCard';
import { QRCodeDisplay } from '@/components/tables/QRCodeDisplay';
import { TableEditDialog } from '@/components/tables/TableEditDialog';
import { BreweryHeatMap } from '@/components/tables/BreweryHeatMap';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/providers/AuthProvider';

export default function Tables() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'qrcodes' | 'heatmap'>('grid');
  const [filterValue, setFilterValue] = useState('');
  
  const isManager = user && (user.role === 'admin' || user.role === 'manager');
  
  // Fetch tables
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['/api/tables'],
  });

  // Filter tables
  const filteredTables = (tables as any[]).filter((table: any) => {
    if (!filterValue) return true;
    
    const tableNumber = table.number.toString();
    const searchValue = filterValue.toLowerCase();
    
    return tableNumber.includes(searchValue) || 
           t(`tables.${table.status}`).toLowerCase().includes(searchValue);
  });
  
  // Open edit dialog for a table
  const handleEditTable = (tableId: number) => {
    const table = (tables as any[]).find((t: any) => t.id === tableId);
    if (table) {
      setEditingTable(table);
    }
  };
  
  // View orders for a table
  const handleViewOrders = (tableId: number) => {
    setLocation(`/orders?table=${tableId}`);
  };
  
  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (tableData: any) => {
      return apiRequest('POST', '/api/tables', tableData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({
        title: t('common.success'),
        description: t('tables.addTable') + ' ' + t('common.success').toLowerCase(),
      });
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('tables.addTable') + ' ' + t('common.error').toLowerCase(),
        variant: 'destructive',
      });
    }
  });
  
  // Update table mutation
  const updateTableMutation = useMutation({
    mutationFn: async ({ id, ...tableData }: any) => {
      return apiRequest('PUT', `/api/tables/${id}`, tableData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({
        title: t('common.success'),
        description: t('tables.editTable') + ' ' + t('common.success').toLowerCase(),
      });
      setEditingTable(null);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('tables.editTable') + ' ' + t('common.error').toLowerCase(),
        variant: 'destructive',
      });
    }
  });
  
  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/tables/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({
        title: t('common.success'),
        description: t('tables.deleteTable') + ' ' + t('common.success').toLowerCase(),
      });
      setEditingTable(null);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('tables.deleteTable') + ' ' + t('common.error').toLowerCase(),
        variant: 'destructive',
      });
    }
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            {t('common.tables')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.tableOverview')}
          </p>
        </div>
        
        {isManager && (
          <Button 
            className="mt-4 sm:mt-0" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('tables.addTable')}
          </Button>
        )}
      </div>
      
      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Input
            type="text"
            placeholder={t('common.search')}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="pl-3"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <GridIcon className="h-4 w-4 mr-2" />
            Visualizar em Grade
          </Button>
          <Button 
            variant={viewMode === 'heatmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('heatmap')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Mapa de Calor
          </Button>
          <Button 
            variant={viewMode === 'qrcodes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('qrcodes')}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            QR Codes
          </Button>
        </div>
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : filteredTables.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTables.map((table: any) => (
              <TableCard 
                key={table.id} 
                table={table} 
                onEdit={isManager ? handleEditTable : undefined}
                onViewOrders={table.status === 'occupied' ? handleViewOrders : undefined}
              />
            ))}
          </div>
        ) : viewMode === 'heatmap' ? (
          <BreweryHeatMap />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredTables.map((table: any) => (
              <QRCodeDisplay key={table.id} table={table} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('common.noData')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filterValue 
              ? t('common.noDataFiltered') 
              : t('common.noDataEmpty')}
          </p>
          {isManager && !filterValue && (
            <Button 
              className="mt-4" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('tables.addTable')}
            </Button>
          )}
        </div>
      )}
      
      {/* Table Edit Dialog */}
      <TableEditDialog
        open={!!editingTable || isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTable(null);
            setIsAddDialogOpen(false);
          }
        }}
        defaultValues={editingTable}
        onSubmit={(tableData: any) => {
          if (editingTable) {
            updateTableMutation.mutate({ id: editingTable.id, ...tableData });
          } else {
            createTableMutation.mutate(tableData);
          }
        }}
        onDelete={editingTable ? () => deleteTableMutation.mutate(editingTable.id) : undefined}
        isLoading={createTableMutation.isPending || updateTableMutation.isPending || deleteTableMutation.isPending}
      />
    </div>
  );
}
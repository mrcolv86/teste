import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Clock, MapPin, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/use-websocket';

interface Table {
  id: number;
  number: number;
  status: 'free' | 'occupied' | 'reserved';
  occupiedSince?: string;
  reservationTime?: string;
}

export function BreweryHeatMap() {
  const { t } = useTranslation();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'floor'>('floor');
  
  // Fetch tables data
  const { data: tables = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/tables'],
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });

  // WebSocket for real-time updates
  const ws = useWebSocket();
  
  // Listen for table status changes
  useEffect(() => {
    const handleTableUpdate = () => {
      refetch();
    };
    
    // Refetch when component mounts
    refetch();
  }, [refetch]);

  const getTableColor = (table: Table) => {
    switch (table.status) {
      case 'free':
        return 'bg-green-400 hover:bg-green-500 border-green-600';
      case 'occupied':
        return 'bg-red-400 hover:bg-red-500 border-red-600';
      case 'reserved':
        return 'bg-yellow-400 hover:bg-yellow-500 border-yellow-600';
      default:
        return 'bg-gray-400 hover:bg-gray-500 border-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'free': return 'Livre';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      default: return status;
    }
  };

  const getOccupationTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    const occupiedTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - occupiedTime) / (1000 * 60));
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const getOccupancyStats = () => {
    const tablesList = tables as Table[];
    const total = tablesList.length;
    const occupied = tablesList.filter((table: Table) => table.status === 'occupied').length;
    const reserved = tablesList.filter((table: Table) => table.status === 'reserved').length;
    const free = tablesList.filter((table: Table) => table.status === 'free').length;
    
    return {
      total,
      occupied,
      reserved,
      free,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
    };
  };

  const stats = getOccupancyStats();

  // Simulated floor plan layout (you can customize this based on your actual layout)
  const getTablePosition = (tableNumber: number) => {
    const positions = [
      // Tables arranged in a floor plan layout
      { top: '10%', left: '15%' },  // Table 1
      { top: '10%', left: '35%' },  // Table 2
      { top: '10%', left: '55%' },  // Table 3
      { top: '10%', left: '75%' },  // Table 4
      { top: '30%', left: '15%' },  // Table 5
      { top: '30%', left: '35%' },  // Table 6
      { top: '30%', left: '55%' },  // Table 7
      { top: '30%', left: '75%' },  // Table 8
      { top: '50%', left: '15%' },  // Table 9
      { top: '50%', left: '35%' },  // Table 10
      { top: '50%', left: '55%' },  // Table 11
      { top: '50%', left: '75%' },  // Table 12
      { top: '70%', left: '25%' },  // Table 13
      { top: '70%', left: '45%' },  // Table 14
      { top: '70%', left: '65%' },  // Table 15
    ];
    
    return positions[tableNumber - 1] || { top: '50%', left: '50%' };
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-amber" />
                Mapa de Calor da Cervejaria
              </CardTitle>
              <CardDescription>
                Visualização em tempo real da ocupação das mesas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'floor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('floor')}
              >
                Planta Baixa
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grade
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total de Mesas</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.free}</div>
              <div className="text-sm text-green-600">Livres</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
              <div className="text-sm text-red-600">Ocupadas</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
              <div className="text-sm text-yellow-600">Reservadas</div>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Taxa de Ocupação</span>
              <span className="text-sm font-bold">{stats.occupancyRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.occupancyRate}%` }}
              ></div>
            </div>
          </div>

          {/* Heat Map */}
          <TooltipProvider>
            {viewMode === 'floor' ? (
              /* Floor Plan View */
              <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg p-4 min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="absolute inset-0 p-4">
                  {/* Floor plan decorative elements */}
                  <div className="absolute top-4 left-4 right-4 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Área do Bar</span>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Entrada Principal</span>
                  </div>

                  {/* Tables positioned on floor plan */}
                  {(tables as Table[]).map((table) => {
                    const position = getTablePosition(table.number);
                    return (
                      <Tooltip key={table.id}>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "absolute w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-white font-bold shadow-lg hover:scale-110",
                              getTableColor(table),
                              selectedTable?.id === table.id && "ring-4 ring-blue-500 ring-opacity-50"
                            )}
                            style={{
                              top: position.top,
                              left: position.left,
                              transform: 'translate(-50%, -50%)'
                            }}
                            onClick={() => setSelectedTable(table)}
                          >
                            {table.number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <div className="font-bold">Mesa {table.number}</div>
                            <div className="text-sm">{getStatusText(table.status)}</div>
                            {table.status === 'occupied' && table.occupiedSince && (
                              <div className="text-xs">Ocupada há {getOccupationTime(table.occupiedSince)}</div>
                            )}
                            {table.status === 'reserved' && table.reservationTime && (
                              <div className="text-xs">Reservada para {new Date(table.reservationTime).toLocaleTimeString()}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {(tables as Table[]).map((table) => (
                  <Tooltip key={table.id}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "aspect-square rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-white font-bold shadow hover:scale-105",
                          getTableColor(table),
                          selectedTable?.id === table.id && "ring-4 ring-blue-500 ring-opacity-50"
                        )}
                        onClick={() => setSelectedTable(table)}
                      >
                        <div className="text-lg">{table.number}</div>
                        <div className="text-xs">{getStatusText(table.status)}</div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <div className="font-bold">Mesa {table.number}</div>
                        <div className="text-sm">{getStatusText(table.status)}</div>
                        {table.status === 'occupied' && table.occupiedSince && (
                          <div className="text-xs">Ocupada há {getOccupationTime(table.occupiedSince)}</div>
                        )}
                        {table.status === 'reserved' && table.reservationTime && (
                          <div className="text-xs">Reservada para {new Date(table.reservationTime).toLocaleTimeString()}</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </TooltipProvider>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-full border border-green-600"></div>
              <span className="text-sm">Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full border border-yellow-600"></div>
              <span className="text-sm">Reservada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded-full border border-red-600"></div>
              <span className="text-sm">Ocupada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Table Details */}
      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mesa {selectedTable.number} - Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getTableColor(selectedTable).replace('hover:', '')}>
                  {getStatusText(selectedTable.status)}
                </Badge>
              </div>
              
              {selectedTable.status === 'occupied' && selectedTable.occupiedSince && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Ocupada desde: {new Date(selectedTable.occupiedSince).toLocaleString()}</span>
                  <span className="font-medium">({getOccupationTime(selectedTable.occupiedSince)})</span>
                </div>
              )}
              
              {selectedTable.status === 'reserved' && selectedTable.reservationTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Reservada para: {new Date(selectedTable.reservationTime).toLocaleString()}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Ver Pedidos
                </Button>
                <Button size="sm" variant="outline">
                  Chamar Garçom
                </Button>
                <Button size="sm" variant="outline">
                  Alterar Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
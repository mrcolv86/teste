import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

export function TableStatus() {
  const { t } = useTranslation();
  
  const { data: tables, isLoading } = useQuery({
    queryKey: ['/api/tables'],
  });

  const getColorsByStatus = (status: string) => {
    switch (status) {
      case 'free':
        return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'occupied':
        return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'reserved':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'free':
        return t('tables.free');
      case 'occupied':
        return t('tables.occupied');
      case 'reserved':
        return t('tables.reserved');
      default:
        return status;
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '00:00';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOccupationTime = (timestamp: string) => {
    if (!timestamp) return '00:00';
    
    const occupiedTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - occupiedTime) / (1000 * 60));
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-full flex flex-col bg-card border border-border shadow rounded-lg">
      <CardHeader>
        <CardTitle className="text-foreground">
          {t('tables.status')}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Visão Geral
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 border-t border-border">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <Skeleton 
                key={i}
                className="h-24 w-full rounded-lg"
              />
            ))
          ) : (
            tables?.slice(0, 8).map((table: any) => (
              <div 
                key={table.id}
                className={cn(
                  "shadow-sm rounded-lg p-4 text-center hover:shadow-md transition-shadow",
                  getColorsByStatus(table.status)
                )}
              >
                <div className="text-xl font-medium">Mesa {table.number.toString().padStart(2, '0')}</div>
                <div className="text-sm mt-1">{getStatusText(table.status)}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  {table.status === 'occupied' ? getOccupationTime(table.occupiedSince) : 
                   table.status === 'reserved' ? formatTime(table.reservationTime) : 
                   'Mesa disponível'}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <div className="p-4 bg-accent/10 border-t border-border text-right">
        <Link href="/tables" className="text-sm font-medium text-amber hover:text-amber/80">
          Gestão de mesas →
        </Link>
      </div>
    </Card>
  );
}

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CardBierServ } from '@/components/ui/card-bierserv';
import { Badge } from '@/components/ui/badge';
import { Pencil, Utensils, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TableCardProps {
  table: {
    id: number;
    number: number;
    status: string;
    occupiedSince?: string;
    reservationTime?: string;
  };
  onEdit?: (tableId: number) => void;
  onViewOrders?: (tableId: number) => void;
}

export function TableCard({ table, onEdit, onViewOrders }: TableCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Status update mutation
  const updateTableStatusMutation = useMutation({
    mutationFn: async ({ tableId, status }: { tableId: number; status: string }) => {
      return apiRequest('PUT', `/api/tables/${tableId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({
        title: 'Status da mesa atualizado',
        description: 'O status da mesa foi alterado com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status da mesa',
        variant: 'destructive',
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'free':
        return 'Livre';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      default:
        return status;
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOccupationTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    const occupiedTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - occupiedTime) / (1000 * 60));
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleStatusToggle = (currentStatus: string) => {
    let newStatus;
    switch (currentStatus) {
      case 'free':
        newStatus = 'reserved';
        break;
      case 'reserved':
        newStatus = 'occupied';
        break;
      case 'occupied':
        newStatus = 'free';
        break;
      default:
        newStatus = 'free';
    }
    
    updateTableStatusMutation.mutate({ tableId: table.id, status: newStatus });
  };

  const getNextStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'free':
        return 'Reservar';
      case 'reserved':
        return 'Ocupar';
      case 'occupied':
        return 'Liberar';
      default:
        return 'Alterar';
    }
  };

  return (
    <CardBierServ 
      title={`Mesa ${table.number.toString().padStart(2, '0')}`}
      badge={getStatusText(table.status)}
      badgeVariant={table.status === 'free' ? 'default' : table.status === 'occupied' ? 'destructive' : 'secondary'}
      className="flex flex-col"
      actions={
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline"
            size="sm" 
            className="flex-1"
            onClick={() => handleStatusToggle(table.status)}
            disabled={updateTableStatusMutation.isPending}
          >
            {updateTableStatusMutation.isPending ? (
              'Atualizando...'
            ) : (
              getNextStatusText(table.status)
            )}
          </Button>
          
          {table.status === 'occupied' && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1 bg-amber hover:bg-amber/90 text-white"
              onClick={() => console.log('Chamando garçom para mesa', table.number)}
            >
              Chamar Garçom
            </Button>
          )}
          
          {onEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEdit(table.id)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {table.status === 'occupied' && table.occupiedSince && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Ocupada desde: {formatTime(table.occupiedSince)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Tempo de ocupação: {getOccupationTime(table.occupiedSince)}
            </div>
          </div>
        )}
        
        {table.status === 'reserved' && table.reservationTime && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Reservada para: {formatTime(table.reservationTime)}</span>
            </div>
          </div>
        )}

        {table.status === 'free' && (
          <div className="text-sm text-muted-foreground">
            Mesa disponível para novos clientes
          </div>
        )}
      </div>
    </CardBierServ>
  );
}

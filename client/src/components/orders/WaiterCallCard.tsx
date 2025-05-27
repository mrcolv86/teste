import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock } from 'lucide-react';

interface WaiterCallCardProps {
  tableNumber: number;
  timestamp: string;
  onDismiss?: () => void;
}

export function WaiterCallCard({ tableNumber, timestamp, onDismiss }: WaiterCallCardProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 mb-2">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <Bell className="h-4 w-4 text-orange-600 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Garçom chamado - Mesa {tableNumber.toString().padStart(2, '0')}
              </p>
              <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(timestamp)}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Urgente
          </Badge>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-2 text-orange-400 hover:text-orange-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
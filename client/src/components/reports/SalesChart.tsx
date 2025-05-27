import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/utils/format';

interface SalesChartProps {
  data: any[];
  title?: string;
  isLoading?: boolean;
}

export function SalesChart({ 
  data, 
  title = 'Sales Overview', 
  isLoading = false 
}: SalesChartProps) {
  const { t } = useTranslation();
  
  // Format currency for the tooltip
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Descrição das Vendas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            {t('common.noData')}
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar dataKey="value" name="Vendas" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
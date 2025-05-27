import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface BeerCardProps {
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    ibu?: number;
    abv?: number;
    pairings?: string[];
    categoryId: number;
    isActive: boolean;
  };
  showDetails?: boolean;
}

export function BeerCard({ product, showDetails = true }: BeerCardProps) {
  const { t, i18n } = useTranslation();
  
  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  // Get translated name and description if available
  const getName = () => {
    if (product.translations && product.translations[i18n.language]) {
      return product.translations[i18n.language].name || product.name;
    }
    return product.name;
  };

  const getDescription = () => {
    if (product.translations && product.translations[i18n.language]) {
      return product.translations[i18n.language].description || product.description;
    }
    return product.description;
  };

  return (
    <Card className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      <img 
        src={product.image || 'https://placehold.co/400x200/e2e8f0/1e293b?text=No+Image'} 
        alt={getName()} 
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-beer font-semibold text-gray-900 dark:text-white">
            {getName()}
          </h4>
          <Badge className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber/10 text-amber">
            {formatCurrency(product.price)}
          </Badge>
        </div>
        
        {(product.ibu || product.abv) && (
          <div className="mt-2 flex space-x-2">
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
        
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {getDescription()}
        </p>
        
        {showDetails && product.pairings && product.pairings.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {t('customer.pairingWith')}:
            </h5>
            <div className="mt-1 flex flex-wrap gap-1">
              {product.pairings.map((pairing, index) => (
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
        
        {showDetails && (
          <div className="mt-4 flex justify-end">
            <Link href={`/menu/${product.id}`}>
              <a className="text-sm font-medium text-amber hover:text-amber/80">
                {t('common.view')} &rarr;
              </a>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

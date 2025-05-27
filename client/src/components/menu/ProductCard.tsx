import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Wine, Thermometer, Glasses } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description?: string;
    price: number;
    image?: string;
    ibu?: number;
    abv?: number;
    pairings?: string | string[];
    isActive: boolean;
  };
  onAddToCart?: (productId: number, quantity: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPairings = () => {
    if (!product.pairings) return [];
    return Array.isArray(product.pairings) ? product.pairings : [product.pairings];
  };

  return (
    <Card className="h-full flex flex-col card-interactive hover-lift">
      {product.image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover hover-scale transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="line-clamp-2 break-words text-lg font-semibold">
            {product.name}
          </CardTitle>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-amber">
              {formatPrice(product.price)}
            </div>
          </div>
        </div>
        
        {product.description && (
          <CardDescription className="line-clamp-3 break-words text-sm">
            {product.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="space-y-3">
          {(product.ibu || product.abv) && (
            <div className="flex gap-2">
              {product.ibu && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  <span>IBU: {product.ibu}</span>
                </Badge>
              )}
              {product.abv && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Glasses className="h-3 w-3" />
                  <span>ABV: {product.abv}%</span>
                </Badge>
              )}
            </div>
          )}

          {getPairings().length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Wine className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Harmonização:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {getPairings().slice(0, 3).map((pairing, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {pairing}
                  </Badge>
                ))}
                {getPairings().length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{getPairings().length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
        
        {onAddToCart && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 p-0"
                >
                  -
                </Button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8 p-0"
                >
                  +
                </Button>
              </div>
              <Button
                size="sm"
                className="flex-1 bg-amber hover:bg-amber/90"
                onClick={() => onAddToCart(product.id, quantity)}
              >
                Adicionar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
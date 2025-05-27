import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';
import { Check } from 'lucide-react';

interface ProductVariation {
  id: number;
  productId: number;
  name: string;
  priceAdjustment: number;
  description?: string;
  isActive: boolean;
}

interface ProductVariationSelectorProps {
  productId: number;
  basePrice: number;
  onVariationSelect: (variation: ProductVariation | null) => void;
  selectedVariationId?: number;
}

export function ProductVariationSelector({
  productId,
  basePrice,
  onVariationSelect,
  selectedVariationId
}: ProductVariationSelectorProps) {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  // Fetch variations for this product
  const { data: variations = [], isLoading } = useQuery({
    queryKey: [`/api/product-variations?productId=${productId}`],
  });

  // Set default selection to first variation or null if no variations
  useEffect(() => {
    if (variations.length > 0 && !selectedVariationId) {
      const defaultVariation = variations[0];
      setSelectedVariation(defaultVariation);
      onVariationSelect(defaultVariation);
    } else if (selectedVariationId) {
      const variation = variations.find((v: ProductVariation) => v.id === selectedVariationId);
      if (variation) {
        setSelectedVariation(variation);
        onVariationSelect(variation);
      }
    }
  }, [variations, selectedVariationId, onVariationSelect]);

  const handleVariationSelect = (variation: ProductVariation) => {
    setSelectedVariation(variation);
    onVariationSelect(variation);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // If no variations, don't show the selector
  if (variations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Escolha o tamanho:
      </p>
      
      <div className="flex flex-wrap gap-2">
        {variations
          .filter((variation: ProductVariation) => variation.isActive)
          .map((variation: ProductVariation) => {
            const finalPrice = basePrice + variation.priceAdjustment;
            const isSelected = selectedVariation?.id === variation.id;
            
            return (
              <Button
                key={variation.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`relative transition-all ${
                  isSelected 
                    ? "bg-orange-600 text-white border-orange-600 shadow-md" 
                    : "border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                }`}
                onClick={() => handleVariationSelect(variation)}
              >
                {isSelected && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                <div className="flex flex-col items-center">
                  <span className="font-medium">{variation.name}</span>
                  <span className="text-xs">
                    {formatCurrency(finalPrice)}
                  </span>
                </div>
                
                {variation.priceAdjustment !== 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`absolute -top-1 -right-1 text-xs px-1 py-0 min-w-[20px] h-4 ${
                      variation.priceAdjustment > 0 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {variation.priceAdjustment > 0 ? '+' : ''}{formatCurrency(variation.priceAdjustment)}
                  </Badge>
                )}
              </Button>
            );
          })}
      </div>
      
      {selectedVariation?.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          {selectedVariation.description}
        </p>
      )}
    </div>
  );
}
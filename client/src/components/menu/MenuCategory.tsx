import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAbv, formatIbu } from '@/utils/format';

interface MenuCategoryProps {
  category: any;
  products: any[];
}

export function MenuCategory({ category, products }: MenuCategoryProps) {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2 className="text-2xl font-beer font-bold mb-4">{category.name}</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{product.name}</CardTitle>
            </CardHeader>
            
            <CardContent>
              {/* Product details */}
              <div className="flex flex-wrap gap-2 mb-3">
                {product.abv && (
                  <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 px-2 py-1 rounded text-xs">
                    ABV: {formatAbv(product.abv)}
                  </span>
                )}
                
                {product.ibu && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded text-xs">
                    IBU: {formatIbu(product.ibu)}
                  </span>
                )}
              </div>
              
              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {product.description || t('products.noDescription')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
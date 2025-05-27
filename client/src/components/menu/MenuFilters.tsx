import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, X } from 'lucide-react';

interface MenuFiltersProps {
  categories: any[];
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  abvRange: number[];
  onAbvChange: (range: number[]) => void;
  ibuRange: number[];
  onIbuChange: (range: number[]) => void;
}

export function MenuFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  abvRange,
  onAbvChange,
  ibuRange,
  onIbuChange
}: MenuFiltersProps) {
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Reset all filters
  const resetFilters = () => {
    onCategoryChange(null);
    onSearchChange('');
    onAbvChange([0, 100]);
    onIbuChange([0, 1000]);
  };
  
  // Format ABV as percentage
  const formatAbvDisplay = (value: number) => {
    return `${value}%`;
  };
  
  return (
    <div>
      {/* Mobile Filters */}
      <div className="block md:hidden">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder={t('common.search')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5 h-7 w-7"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Button
            variant={filtersOpen ? "default" : "outline"}
            size="icon"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        {filtersOpen && (
          <Accordion type="single" collapsible className="w-full mb-4 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
            <AccordionItem value="categories">
              <AccordionTrigger>{t('categories.categories')}</AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[200px]">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => onCategoryChange(null)}
                    >
                      {t('common.all')}
                    </Button>
                    
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => onCategoryChange(category.id)}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="abv">
              <AccordionTrigger>ABV</AccordionTrigger>
              <AccordionContent>
                <div className="px-2 py-4">
                  <Slider
                    value={abvRange}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={onAbvChange}
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>{formatAbvDisplay(abvRange[0])}</span>
                    <span>{formatAbvDisplay(abvRange[1])}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="ibu">
              <AccordionTrigger>IBU</AccordionTrigger>
              <AccordionContent>
                <div className="px-2 py-4">
                  <Slider
                    value={ibuRange}
                    min={0}
                    max={1000}
                    step={10}
                    onValueChange={onIbuChange}
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>{ibuRange[0]}</span>
                    <span>{ibuRange[1]}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <div className="pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={resetFilters}
              >
                {t('common.resetFilters')}
              </Button>
            </div>
          </Accordion>
        )}
      </div>
      
      {/* Desktop Filters */}
      <div className="hidden md:flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        {/* Categories */}
        <div className="w-full md:w-1/3">
          <h3 className="font-medium mb-2">{t('categories.categories')}</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1 pr-4">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => onCategoryChange(null)}
              >
                {t('common.all')}
              </Button>
              
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onCategoryChange(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Search and Filters */}
        <div className="w-full md:w-2/3 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t('common.search')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1.5 h-7 w-7"
                  onClick={() => onSearchChange('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* ABV Slider */}
            <div>
              <label className="text-sm font-medium">
                ABV
              </label>
              <div className="px-2 py-2">
                <Slider
                  value={abvRange}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={onAbvChange}
                />
                <div className="flex justify-between mt-1 text-sm text-gray-500">
                  <span>{formatAbvDisplay(abvRange[0])}</span>
                  <span>{formatAbvDisplay(abvRange[1])}</span>
                </div>
              </div>
            </div>
            
            {/* IBU Slider */}
            <div>
              <label className="text-sm font-medium">
                IBU
              </label>
              <div className="px-2 py-2">
                <Slider
                  value={ibuRange}
                  min={0}
                  max={1000}
                  step={10}
                  onValueChange={onIbuChange}
                />
                <div className="flex justify-between mt-1 text-sm text-gray-500">
                  <span>{ibuRange[0]}</span>
                  <span>{ibuRange[1]}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            className="mt-4 self-start"
            onClick={resetFilters}
          >
            {t('common.resetFilters')}
          </Button>
        </div>
      </div>
    </div>
  );
}
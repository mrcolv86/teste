import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Form schema
const orderFormSchema = z.object({
  status: z.enum(['new', 'preparing', 'ready', 'delivered', 'paid', 'cancelled']),
});

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function OrderEditDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isLoading = false,
}: OrderEditDialogProps) {
  const { t } = useTranslation();
  
  // Initialize form
  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: defaultValues ? {
      status: defaultValues.status,
    } : {
      status: 'new',
    },
  });
  
  // Update form when defaultValues changes
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        status: defaultValues.status,
      });
    }
  }, [defaultValues, form]);
  
  // Handle form submission
  const handleSubmit = (values: z.infer<typeof orderFormSchema>) => {
    onSubmit(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t('orders.updateOrder')} #{defaultValues?.id}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orders.status')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('orders.status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">{t('orders.new')}</SelectItem>
                      <SelectItem value="preparing">{t('orders.preparing')}</SelectItem>
                      <SelectItem value="ready">{t('orders.ready')}</SelectItem>
                      <SelectItem value="delivered">{t('orders.delivered')}</SelectItem>
                      <SelectItem value="paid">{t('orders.paid')}</SelectItem>
                      <SelectItem value="cancelled">{t('orders.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
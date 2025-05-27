import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { generateTableQRCode } from '@/utils/qrcode';

// Form schema
const tableFormSchema = z.object({
  number: z.coerce.number()
    .int({ message: "Table number must be an integer" })
    .positive({ message: "Table number must be positive" }),
  status: z.enum(['free', 'occupied', 'reserved']),
  occupiedSince: z.string().optional(),
  reservationTime: z.string().optional(),
});

interface TableEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: any;
  onSubmit: (data: any) => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export function TableEditDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  onDelete,
  isLoading = false,
}: TableEditDialogProps) {
  const { t } = useTranslation();
  
  // Initialize form
  const form = useForm<z.infer<typeof tableFormSchema>>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: defaultValues ? {
      number: defaultValues.number,
      status: defaultValues.status,
      occupiedSince: defaultValues.occupiedSince ? new Date(defaultValues.occupiedSince).toISOString().slice(0, 16) : undefined,
      reservationTime: defaultValues.reservationTime ? new Date(defaultValues.reservationTime).toISOString().slice(0, 16) : undefined,
    } : {
      number: 1,
      status: 'free',
      occupiedSince: undefined,
      reservationTime: undefined,
    },
  });
  
  // Update form when defaultValues changes
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        number: defaultValues.number,
        status: defaultValues.status,
        occupiedSince: defaultValues.occupiedSince ? new Date(defaultValues.occupiedSince).toISOString().slice(0, 16) : undefined,
        reservationTime: defaultValues.reservationTime ? new Date(defaultValues.reservationTime).toISOString().slice(0, 16) : undefined,
      });
    } else {
      form.reset({
        number: 1,
        status: 'free',
        occupiedSince: undefined,
        reservationTime: undefined,
      });
    }
  }, [defaultValues, open]);
  
  // Handle form submission
  const handleSubmit = (values: z.infer<typeof tableFormSchema>) => {
    // Generate QR code if not editing
    const qrCode = !defaultValues 
      ? generateTableQRCode(values.number) 
      : defaultValues.qrCode || generateTableQRCode(values.number);
    
    // Convert dates to ISO strings
    const formattedValues = {
      ...values,
      qrCode,
      occupiedSince: values.occupiedSince || null,
      reservationTime: values.reservationTime || null,
    };
    
    onSubmit(formattedValues);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? t('tables.editTable') : t('tables.addTable')}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tables.tableNumber')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.status')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">{t('tables.free')}</SelectItem>
                      <SelectItem value="occupied">{t('tables.occupied')}</SelectItem>
                      <SelectItem value="reserved">{t('tables.reserved')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('status') === 'occupied' && (
              <FormField
                control={form.control}
                name="occupiedSince"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tables.occupiedSince')}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {form.watch('status') === 'reserved' && (
              <FormField
                control={form.control}
                name="reservationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tables.reservationTime')}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="flex justify-between pt-4">
              <div>
                {defaultValues && onDelete && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={onDelete}
                    disabled={isLoading}
                  >
                    {t('common.delete')}
                  </Button>
                )}
              </div>
              
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

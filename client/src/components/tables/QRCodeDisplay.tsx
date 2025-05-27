import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { generateQRCode } from '@/utils/qrcode';

interface QRCodeDisplayProps {
  table: {
    id: number;
    number: number;
    qrCode: string;
  };
  onPrint?: () => void;
}

export function QRCodeDisplay({ table, onPrint }: QRCodeDisplayProps) {
  const { t } = useTranslation();
  
  // Generate QR code with full URL that works in test environment
  const baseUrl = window.location.origin;
  const tableUrl = `${baseUrl}/menu/table/${table.number}`;
  const qrCodeUrl = generateQRCode(tableUrl);
  
  // Handle print function
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      // Create a printable version
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${t('tables.tableNumber')} ${table.number}</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; }
                .container { margin: 20px auto; max-width: 300px; }
                img { max-width: 100%; height: auto; }
                h2 { margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <img src="${qrCodeUrl}" alt="QR Code" />
                <h2>${t('tables.tableNumber')} ${table.number}</h2>
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Print after image is loaded
        const img = printWindow.document.querySelector('img');
        if (img) {
          img.onload = () => {
            printWindow.print();
            printWindow.close();
          };
        } else {
          printWindow.print();
          printWindow.close();
        }
      }
    }
  };
  
  return (
    <Card className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center hover:border-amber dark:hover:border-amber transition-colors">
      <div className="bg-white p-2 rounded-md mb-2">
        <img 
          src={qrCodeUrl} 
          alt={`QR Code ${t('tables.tableNumber')} ${table.number}`} 
          className="w-full h-auto"
        />
      </div>
      <CardContent className="p-0 pt-2">
        <div className="text-sm text-gray-900 dark:text-white font-medium">
          {t('tables.tableNumber')} {table.number.toString().padStart(2, '0')}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrint}
          className="mt-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-amber bg-amber/10 hover:bg-amber/20"
        >
          <Printer className="h-3 w-3 mr-1" />
          {t('dashboard.print')}
        </Button>
      </CardContent>
    </Card>
  );
}

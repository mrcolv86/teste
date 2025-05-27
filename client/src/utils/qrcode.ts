/**
 * Utility function to generate QR code URLs using the QR Server API
 */
export function generateQRCode(data: string, size: number = 200): string {
  // Encode the data to be URL-safe
  const encodedData = encodeURIComponent(data);
  
  // Use the QR Server API to generate the QR code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
  
  return qrCodeUrl;
}

/**
 * Generate a QR code URL for a table
 */
export function generateTableQRCode(tableNumber: number, size: number = 200): string {
  // Get the base URL (dynamically from the current URL)
  const baseUrl = window.location.origin;
  
  // Create the URL that the QR code will point to
  const tableUrl = `${baseUrl}/menu/table/${tableNumber}`;
  
  return generateQRCode(tableUrl, size);
}

/**
 * Generate a downloadable QR code data URI 
 * This can be used for creating a downloadable image
 */
export async function getQRCodeDataURI(data: string, size: number = 200): Promise<string> {
  const qrCodeUrl = generateQRCode(data, size);
  
  try {
    const response = await fetch(qrCodeUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error generating QR code data URI:', error);
    return '';
  }
}

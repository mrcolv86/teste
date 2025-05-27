import jsPDF from 'jspdf';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  abv?: number;
  ibu?: number;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
}

interface BrewerySettings {
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface MenuData {
  products: Product[];
  categories: Category[];
  brewerySettings: BrewerySettings;
}

export const exportMenuToPDF = async (categories: Category[], products: Product[], brewerySettings: BrewerySettings) => {
  const data = { categories, products, brewerySettings };
  return generateMenuPDF(data);
};

export const exportCompactMenuToPDF = async (categories: Category[], products: Product[], brewerySettings: BrewerySettings) => {
  const data = { categories, products, brewerySettings };
  return generateCompactMenuPDF(data);
};

const generateMenuPDF = async (data: MenuData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Header with brewery branding
  pdf.setFillColor(215, 119, 6); // Amber color
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  // Add logo if available
  if (data.brewerySettings.logo || data.brewerySettings.menuLogo) {
    try {
      const logoUrl = data.brewerySettings.menuLogo || data.brewerySettings.logo;
      // Create a promise to load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate logo dimensions (max 30px height, centered)
          const maxHeight = 30;
          const ratio = img.width / img.height;
          const logoHeight = Math.min(maxHeight, img.height);
          const logoWidth = logoHeight * ratio;
          
          // Center the logo horizontally
          const logoX = (pageWidth - logoWidth) / 2;
          const logoY = 10;
          
          try {
            pdf.addImage(img, 'JPEG', logoX, logoY, logoWidth, logoHeight);
          } catch (e) {
            console.warn('Could not add logo to PDF');
          }
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = logoUrl;
      });
      
      yPosition = 55; // Adjust position after logo
    } catch (error) {
      console.warn('Could not load logo for PDF');
      yPosition = 40;
    }
  } else {
    yPosition = 40;
  }
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.brewerySettings.name || 'BierServ', pageWidth / 2, yPosition - 10, { align: 'center' });

  yPosition = 50;
  
  // Menu title
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CARDÁPIO DIGITAL', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;

  // Group products by category
  const productsByCategory = data.categories.map(category => ({
    category,
    products: data.products.filter(product => product.categoryId === category.id)
  })).filter(group => group.products.length > 0);

  // Render each category
  productsByCategory.forEach((group, categoryIndex) => {
    checkNewPage(30);
    
    // Category header
    pdf.setFillColor(245, 245, 245);
    pdf.rect(10, yPosition - 5, pageWidth - 20, 20, 'F');
    
    pdf.setTextColor(215, 119, 6);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(group.category.name.toUpperCase(), 15, yPosition + 8);
    
    yPosition += 25;

    // Products in this category
    group.products.forEach((product, productIndex) => {
      checkNewPage(40);
      
      // Product name and price
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(product.name, 15, yPosition);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(215, 119, 6);
      const priceText = formatCurrency(product.price);
      const priceWidth = pdf.getTextWidth(priceText);
      pdf.text(priceText, pageWidth - 15 - priceWidth, yPosition);
      
      yPosition += 8;

      // Product details (ABV, IBU)
      if (product.abv || product.ibu) {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        let detailsText = '';
        if (product.abv) {
          detailsText += `ABV: ${product.abv}%`;
        }
        if (product.ibu) {
          if (detailsText) detailsText += ' • ';
          detailsText += `IBU: ${product.ibu}`;
        }
        
        pdf.text(detailsText, 15, yPosition);
        yPosition += 8;
      }

      // Product description
      if (product.description) {
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Split long descriptions into multiple lines
        const maxWidth = pageWidth - 30;
        const words = product.description.split(' ');
        let line = '';
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const testWidth = pdf.getTextWidth(testLine);
          
          if (testWidth > maxWidth && line !== '') {
            pdf.text(line.trim(), 15, yPosition);
            line = word + ' ';
            yPosition += 6;
          } else {
            line = testLine;
          }
        });
        
        if (line.trim()) {
          pdf.text(line.trim(), 15, yPosition);
          yPosition += 6;
        }
      }

      yPosition += 8; // Space between products

      // Add a subtle line separator between products (except for the last one)
      if (productIndex < group.products.length - 1) {
        pdf.setDrawColor(230, 230, 230);
        pdf.line(15, yPosition - 4, pageWidth - 15, yPosition - 4);
      }
    });

    yPosition += 15; // Extra space between categories
  });

  // Footer on each page
  const totalPages = Math.ceil(yPosition / pageHeight);
  for (let i = 1; i <= totalPages; i++) {
    if (i > 1) pdf.setPage(i);
    
    // Footer line
    pdf.setDrawColor(215, 119, 6);
    pdf.setLineWidth(2);
    pdf.line(10, pageHeight - 25, pageWidth - 10, pageHeight - 25);
    
    // Footer text
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const footerText = `${data.brewerySettings.name || 'BierServ'} • Cardápio Digital • Gerado em ${new Date().toLocaleDateString('pt-BR')}`;
    pdf.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Page number
    pdf.text(`Página ${i}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }

  // Save the PDF
  const fileName = `cardapio-${(data.brewerySettings.name || 'bierserv').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// Function to export a simplified single-page menu
const generateCompactMenuPDF = async (data: MenuData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Header
  pdf.setFillColor(215, 119, 6);
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.brewerySettings.name || 'BierServ'} - Cardápio`, pageWidth / 2, 16, { align: 'center' });

  yPosition = 40;

  // Group products by category and show in compact format
  const productsByCategory = data.categories.map(category => ({
    category,
    products: data.products.filter(product => product.categoryId === category.id)
  })).filter(group => group.products.length > 0);

  productsByCategory.forEach(group => {
    // Category name
    pdf.setTextColor(215, 119, 6);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(group.category.name.toUpperCase(), 15, yPosition);
    yPosition += 8;

    // Products in compact format
    group.products.forEach(product => {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Product name and price on same line
      const priceText = formatCurrency(product.price);
      const priceWidth = pdf.getTextWidth(priceText);
      
      pdf.text(product.name, 20, yPosition);
      pdf.text(priceText, pageWidth - 20 - priceWidth, yPosition);
      
      yPosition += 6;
    });

    yPosition += 5; // Space between categories
  });

  // Footer
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(8);
  pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 280, { align: 'center' });

  // Save the PDF
  const fileName = `cardapio-compacto-${(data.brewerySettings.name || 'bierserv').toLowerCase().replace(/\s+/g, '-')}.pdf`;
  pdf.save(fileName);
};
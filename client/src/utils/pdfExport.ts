import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  dateRange: string;
  totals: {
    totalSales: number;
    totalOrders: number;
    completedOrders: number;
    totalItemsSold: number;
    averageOrderValue: number;
  };
  topProducts: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    name: string;
    value: number;
  }>;
}

export const generatePDFReport = async (data: ReportData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório BierServ', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Período: ${data.dateRange}`, pageWidth / 2, 30, { align: 'center' });
  
  // Summary section
  let yPosition = 50;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumo Executivo', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Vendas Totais:', formatCurrency(data.totals.totalSales)],
    ['Pedidos Totais:', data.totals.totalOrders.toString()],
    ['Pedidos Concluídos:', data.totals.completedOrders.toString()],
    ['Itens Vendidos:', data.totals.totalItemsSold.toString()],
    ['Valor Médio por Pedido:', formatCurrency(data.totals.averageOrderValue)]
  ];

  summaryData.forEach(([label, value]) => {
    pdf.text(label, 20, yPosition);
    pdf.text(value, 120, yPosition);
    yPosition += 10;
  });

  // Top products section
  yPosition += 20;
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Produtos Mais Vendidos', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  data.topProducts.slice(0, 5).forEach((product, index) => {
    pdf.text(`${index + 1}. ${product.name}`, 20, yPosition);
    pdf.text(`${product.count} unidades`, 120, yPosition);
    pdf.text(formatCurrency(product.revenue), 160, yPosition);
    yPosition += 10;
  });

  // Sales by category section
  yPosition += 20;
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Vendas por Categoria', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  data.salesByCategory.forEach((category) => {
    pdf.text(category.name, 20, yPosition);
    pdf.text(formatCurrency(category.value), 120, yPosition);
    yPosition += 10;
  });

  // Footer
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} - BierServ`,
    pageWidth / 2,
    pdf.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Save the PDF
  const fileName = `relatorio-bierserv-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// Function to export chart as PDF using html2canvas
export const exportChartToPDF = async (elementId: string, fileName: string = 'chart') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento não encontrado');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF();
  
  const imgWidth = 190;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  // Header
  pdf.setFontSize(16);
  pdf.text('Relatório BierServ', 105, 15, { align: 'center' });
  position = 25;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
};
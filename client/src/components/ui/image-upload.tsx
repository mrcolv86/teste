import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export function ImageUpload({ value, onChange, label, placeholder }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      const imageUrl = result.url;
      
      setPreviewUrl(imageUrl);
      onChange(imageUrl);
      
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const clearImage = () => {
    setPreviewUrl('');
    onChange('');
  };

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}
      
      <div className="flex flex-col space-y-4">
        {/* Preview da imagem */}
        {previewUrl && (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'block';
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={clearImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Upload de arquivo */}
        <div className="flex items-center space-x-2">
          <Label
            htmlFor={`file-upload-${label}`}
            className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>{isUploading ? 'Enviando...' : 'Upload de Imagem'}</span>
          </Label>
          <Input
            id={`file-upload-${label}`}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </div>

        {/* Input para URL manual */}
        <div>
          <Label className="text-sm text-gray-600 dark:text-gray-400">
            Ou cole uma URL de imagem:
          </Label>
          <Input
            type="url"
            placeholder={placeholder || "https://exemplo.com/imagem.jpg"}
            value={previewUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
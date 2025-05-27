import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProductRatingProps {
  productId: number;
  productName: string;
  onReviewSubmitted?: () => void;
}

export function ProductRating({ productId, productName, onReviewSubmitted }: ProductRatingProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return apiRequest('POST', `/api/products/${productId}/reviews`, reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      toast({
        title: t('reviews.success'),
        description: t('reviews.thankYou'),
      });
      setRating(0);
      setComment('');
      onReviewSubmitted?.();
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('reviews.error'),
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: 'Avaliação obrigatória',
        description: 'Por favor, selecione uma avaliação',
        variant: 'destructive',
      });
      return;
    }

    submitReviewMutation.mutate({
      rating,
      comment: comment.trim(),
      productId
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Avaliar Produto: {productName}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rating Stars */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Sua Avaliação
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-colors"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-amber text-amber'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {rating} {rating === 1 ? 'estrela' : 'estrelas'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Comentário (Opcional)
          </label>
          <Textarea
            placeholder="Conte-nos sua experiência com este produto..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {comment.length}/500
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitReviewMutation.isPending}
          className="w-full bg-amber hover:bg-amber/90 text-white"
        >
          {submitReviewMutation.isPending ? (
            'Enviando...'
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Avaliação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
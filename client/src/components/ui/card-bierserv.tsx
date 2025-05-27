import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ReactNode } from "react";

interface CardBierServProps {
  title: string;
  description?: string;
  image?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CardBierServ({
  title,
  description,
  image,
  badge,
  badgeVariant = "default",
  children,
  actions,
  className,
  onClick,
}: CardBierServProps) {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        "bg-card border-border",
        "hover:border-amber-300 dark:hover:border-amber-600",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {image && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 break-words">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-3 break-words">
                {description}
              </CardDescription>
            )}
          </div>
          {badge && (
            <Badge variant={badgeVariant} className="flex-shrink-0 ml-2">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {children && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
      
      {actions && (
        <div className="p-4 pt-0 flex gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </Card>
  );
}

// Export compatibility components
export const CardBierServHeader = CardHeader;
export const CardBierServTitle = CardTitle;
export const CardBierServDescription = CardDescription;
export const CardBierServContent = CardContent;
export const CardBierServFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 pt-0">{children}</div>
);

export default CardBierServ;
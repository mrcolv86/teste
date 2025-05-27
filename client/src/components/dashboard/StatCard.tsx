import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: ReactNode;
  iconBackground: string;
  title: string;
  value: string | number;
  footerText: string;
  footerLink?: string;
  onClick?: () => void;
}

export function StatCard({
  icon,
  iconBackground,
  title,
  value,
  footerText,
  footerLink,
  onClick
}: StatCardProps) {
  return (
    <Card className="h-full flex flex-col card-interactive hover-lift animate-fade-in-up">
      <CardContent className="flex-1 p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-lg p-3 hover-scale", iconBackground)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
              <dd>
                <div className="text-2xl font-bold text-foreground">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
        {footerText && (
          <div className="text-sm mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {footerLink ? (
              <a 
                href={footerLink} 
                className="font-medium text-amber hover:text-amber/80 flex items-center justify-between group"
                onClick={(e) => {
                  if (onClick) {
                    e.preventDefault();
                    onClick();
                  }
                }}
              >
                <span>{footerText}</span>
                <span className="text-amber/60 group-hover:text-amber transition-colors">→</span>
              </a>
            ) : (
              <span className="font-medium text-muted-foreground">{footerText}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Link } from 'wouter';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="text-center py-12" data-testid="empty-state">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href={actionHref}>
          <Button data-testid={`button-${actionLabel.toLowerCase().replace(/\s+/g, '-')}`}>
            {actionLabel}
          </Button>
        </Link>
        {secondaryAction && (
          <Link href={secondaryAction.href}>
            <Button variant="outline" data-testid={`button-${secondaryAction.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {secondaryAction.label}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

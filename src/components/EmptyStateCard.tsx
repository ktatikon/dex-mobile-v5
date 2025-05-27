import React, { ReactNode } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <Card className={`p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)] ${className}`}>
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {icon && (
          <div className="mb-4 text-dex-primary">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-dex-text-secondary mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button
            variant="primary"
            onClick={onAction}
            className="mt-2"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default EmptyStateCard;

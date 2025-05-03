import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description?: string;
  returnPath: string;
  returnLabel?: string;
}

const ComingSoonPage = ({
  title,
  description = 'This feature is under development and will be available soon.',
  returnPath,
  returnLabel = 'Go Back'
}: ComingSoonPageProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 p-4">
      <div className="bg-dex-dark/80 backdrop-blur-lg border border-dex-primary/30 rounded-lg p-8 max-w-md w-full shadow-2xl text-center">
        <Clock className="w-16 h-16 mx-auto mb-4 text-dex-accent animate-pulse" />
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-300 mb-8">{description}</p>
        <Button 
          onClick={() => navigate(returnPath)}
          className="bg-dex-dark hover:bg-dex-dark/80 border border-dex-primary/30 text-white flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {returnLabel}
        </Button>
      </div>
    </div>
  );
};

export default ComingSoonPage;

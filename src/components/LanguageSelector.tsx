import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'modal' | 'inline';
  showLabel?: boolean;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showLabel = true,
  className = ''
}) => {
  const { currentLanguage, availableLanguages, changeLanguage, loading } = useLanguage();
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setIsModalOpen(false);
      toast({
        title: t('status.success'),
        description: `Language changed to ${availableLanguages.find(l => l.code === languageCode)?.name}`,
      });
    } catch (error) {
      toast({
        title: t('status.error'),
        description: 'Failed to change language',
        variant: "destructive",
      });
    }
  };

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  if (variant === 'dropdown') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <label className="text-white text-sm">{t('settings.language')}</label>
        )}
        <Select value={currentLanguage} onValueChange={handleLanguageChange} disabled={loading}>
          <SelectTrigger className="bg-dex-secondary border-dex-secondary/30 text-white min-h-[44px] min-w-[160px] hover:bg-dex-secondary/80 transition-colors">
            <div className="flex items-center gap-2 w-full">
              <span className="text-lg">{currentLang?.flag}</span>
              <div className="flex flex-col items-start flex-1">
                <span className="text-sm font-medium">{currentLang?.name}</span>
                <span className="text-xs text-dex-text-secondary">{currentLang?.nativeName}</span>
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-dex-dark border-dex-secondary/30">
            {availableLanguages.map((language) => (
              <SelectItem
                key={language.code}
                value={language.code}
                className="hover:bg-dex-secondary/20 focus:bg-dex-secondary/20 text-white"
              >
                <div className="flex items-center gap-3 py-1">
                  <span className="text-lg">{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{language.name}</span>
                    <span className="text-xs text-dex-text-secondary">{language.nativeName}</span>
                  </div>
                  {currentLanguage === language.code && (
                    <Check className="ml-auto text-dex-primary" size={16} />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={`min-h-[44px] border-dex-secondary/30 text-white hover:bg-dex-secondary/20 ${className}`}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Globe className="mr-2" size={16} />
            )}
            <span className="mr-2">{currentLang?.flag}</span>
            {showLabel ? t('settings.language') : currentLang?.name}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Globe size={20} />
              {t('settings.language')}
            </DialogTitle>
            <DialogDescription className="text-dex-text-secondary">
              Choose your preferred language for the app interface
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {availableLanguages.map((language) => (
              <Card
                key={language.code}
                className={`cursor-pointer transition-all duration-200 hover:bg-dex-secondary/20 ${
                  currentLanguage === language.code
                    ? 'bg-dex-primary/20 border-dex-primary/50'
                    : 'bg-dex-secondary/10 border-dex-secondary/30'
                }`}
                onClick={() => handleLanguageChange(language.code)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{language.flag}</span>
                      <div>
                        <p className="text-white font-medium">{language.name}</p>
                        <p className="text-dex-text-secondary text-sm">{language.nativeName}</p>
                      </div>
                    </div>
                    {currentLanguage === language.code && (
                      <Check className="text-dex-primary" size={20} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Inline variant
  return (
    <div className={`space-y-3 ${className}`}>
      {showLabel && (
        <h3 className="text-white font-semibold">{t('settings.language')}</h3>
      )}
      <div className="grid gap-2">
        {availableLanguages.map((language) => (
          <Button
            key={language.code}
            variant={currentLanguage === language.code ? "default" : "outline"}
            className={`justify-start min-h-[44px] ${
              currentLanguage === language.code
                ? 'bg-dex-primary hover:bg-dex-primary/90 text-white'
                : 'border-dex-secondary/30 text-white hover:bg-dex-secondary/20'
            }`}
            onClick={() => handleLanguageChange(language.code)}
            disabled={loading}
          >
            <span className="mr-3 text-lg">{language.flag}</span>
            <div className="flex-1 text-left">
              <div className="font-medium">{language.name}</div>
              <div className="text-xs opacity-70">{language.nativeName}</div>
            </div>
            {currentLanguage === language.code && (
              <Check size={16} />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;

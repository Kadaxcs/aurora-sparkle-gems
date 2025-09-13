import React from 'react';
import { Shield, Lock, CheckCircle, Star, CreditCard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SecurityBadgesProps {
  variant?: 'default' | 'compact' | 'minimal';
  showLabels?: boolean;
  className?: string;
}

export const SecurityBadges: React.FC<SecurityBadgesProps> = ({ 
  variant = 'default', 
  showLabels = true, 
  className = '' 
}) => {
  const badges = [
    {
      icon: CreditCard,
      label: 'Mercado Pago',
      description: 'Pagamento 100% seguro com Mercado Pago',
      color: 'text-blue-600',
      verified: true
    },
    {
      icon: Shield,
      label: 'Site Blindado',
      description: 'Site protegido contra fraudes e malware',
      color: 'text-green-600',
      verified: true
    },
    {
      icon: Lock,
      label: 'SSL Seguro',
      description: 'Conexão criptografada SSL/TLS',
      color: 'text-emerald-600',
      verified: true
    },
    {
      icon: CheckCircle,
      label: 'Google Safe',
      description: 'Verificado pelo Google Safe Browsing',
      color: 'text-blue-500',
      verified: true
    },
    {
      icon: Star,
      label: 'Reclame Aqui',
      description: 'Empresa cadastrada no Reclame Aqui',
      color: 'text-yellow-600',
      verified: true,
      link: 'https://www.reclameaqui.com.br'
    }
  ];

  const getSize = () => {
    switch (variant) {
      case 'compact':
        return { icon: 16, container: 'gap-2' };
      case 'minimal':
        return { icon: 14, container: 'gap-1' };
      default:
        return { icon: 20, container: 'gap-3' };
    }
  };

  const { icon: iconSize, container: containerGap } = getSize();

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap items-center ${containerGap} ${className}`}>
        {badges.map((badge, index) => {
          const BadgeIcon = badge.icon;
          
          const BadgeContent = (
            <div className="flex items-center gap-1.5 group cursor-help">
              <div className={`${badge.color} transition-colors group-hover:opacity-80`}>
                <BadgeIcon size={iconSize} />
              </div>
              {showLabels && variant !== 'minimal' && (
                <span className="text-xs font-medium text-muted-foreground">
                  {badge.label}
                </span>
              )}
              {badge.verified && (
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              )}
            </div>
          );

          const content = badge.link ? (
            <a 
              href={badge.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              {BadgeContent}
            </a>
          ) : (
            BadgeContent
          );

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                {content}
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{badge.label}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default SecurityBadges;
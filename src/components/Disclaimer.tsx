import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Language, translations } from '../i18n';

interface DisclaimerProps {
  extended?: boolean;
  className?: string;
  lang?: Language;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({
  extended = false,
  className = '',
  lang = 'ID',
}) => {
  const t = translations[lang];

  return (
    <div className={`text-center py-4 px-3 text-[#1B1B1F]/65 text-xs leading-relaxed ${className}`}>
      <div className="inline-flex items-center justify-center gap-1.5 font-medium text-[#1B1B1F]/75 mb-1">
        <ShieldAlert className="w-3.5 h-3.5 text-[#14213D]/70 shrink-0" />
        <span>{t.disclaimerShort}</span>
      </div>
      {extended && (
        <p className="max-w-xs mx-auto text-[11px] text-[#1B1B1F]/55 mt-0.5 leading-normal">
          {t.disclaimerExtended}
        </p>
      )}
    </div>
  );
};

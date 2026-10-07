import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'warm';
  highlightBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  highlightBorder = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#FFFFFF] border-[#E8DFC9]',
    accent: 'bg-[#FFFDF7] border-[#FCA311]/40',
    warm: 'bg-[#FFFDF9] border-[#E8DFC9]',
  }[variant];

  const borderClass = highlightBorder ? 'border-2 border-[#14213D]' : 'border';

  return (
    <div
      className={`rounded-[16px] ${borderClass} ${variantStyles} p-5 shadow-[0_4px_16px_-2px_rgba(20,33,61,0.05),0_2px_6px_-1px_rgba(20,33,61,0.03)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

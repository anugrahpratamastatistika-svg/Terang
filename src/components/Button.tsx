import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'text' | 'danger';
  size?: 'normal' | 'large' | 'compact';
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'large',
  fullWidth = true,
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  // Base styling adhering to UI guidelines:
  // - Tombol utama tinggi minimal 52px, lebar penuh, radius 14px, latar #14213D teks putih
  // - Tombol aksen latar #FCA311 teks #14213D
  // - Active feedback <= 200ms
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#14213D] focus-visible:outline-none';

  const widthClass = fullWidth ? 'w-full' : '';

  const sizeClasses = {
    large: 'min-h-[52px] h-[52px] px-6 text-[17px] rounded-[14px]',
    normal: 'min-h-[48px] h-[48px] px-5 text-[16px] rounded-[12px]',
    compact: 'min-h-[48px] px-4 text-[14px] rounded-[10px]',
  }[size];

  const variantClasses = {
    primary: 'bg-[#14213D] text-white hover:bg-[#1E2E52] active:bg-[#0E172B] shadow-sm',
    accent: 'bg-[#FCA311] text-[#14213D] hover:bg-[#EAA10E] active:bg-[#D79109] shadow-sm font-bold',
    secondary: 'bg-[#FFFFFF] text-[#14213D] border border-[#E8DFC9] hover:bg-[#FFF9EC] active:bg-[#F3EAD3]',
    text: 'bg-transparent text-[#14213D] hover:bg-[#14213D]/5 underline-offset-4 hover:underline',
    danger: 'bg-[#D62839] text-white hover:bg-[#BD1F2F] active:bg-[#9E1A27]',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${widthClass} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2.5 flex items-center justify-center shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

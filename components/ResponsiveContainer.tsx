import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 ${className}`}>
      {children}
    </div>
  );
}

export function ResponsiveGrid({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  );
}

export function ResponsiveCard({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function ResponsiveButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  [key: string]: any;
}) {
  const baseClasses = 'font-medium rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 sm:px-6 py-3 sm:py-2 text-sm sm:text-base min-h-[44px]',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg min-h-[48px]'
  };
  
  const variantClasses = {
    primary: 'bg-plant-green-600 text-white hover:bg-plant-green-700 focus:ring-plant-green-500',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border-2 border-plant-green-600 text-plant-green-600 hover:bg-plant-green-50 focus:ring-plant-green-500'
  };
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ResponsiveInput({ 
  className = '', 
  ...props 
}: {
  className?: string;
  [key: string]: any;
}) {
  return (
    <input
      className={`w-full px-3 sm:px-4 py-3 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500 touch-manipulation ${className}`}
      {...props}
    />
  );
}

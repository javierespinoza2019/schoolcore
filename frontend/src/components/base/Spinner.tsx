interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <i className={`ri-loader-4-line animate-spin text-foreground-400 ${sizeMap[size]}`} />
    </div>
  );
}
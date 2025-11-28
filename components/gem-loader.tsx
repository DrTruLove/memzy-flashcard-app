interface GemLoaderProps {
  size?: number
  className?: string
}

export function GemLoader({ size = 64, className = '' }: GemLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/loading-gem.gif" 
        alt="Loading..." 
        width={size} 
        height={size}
        className="object-contain"
      />
    </div>
  )
}

import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  className?: string
  size?: number
  title?: string
}

export function VerifiedBadge({ className, size = 16, title = 'Verified' }: VerifiedBadgeProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn('inline-block flex-shrink-0', className)}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <path
        fill="#1d9bf0"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
      />
      <path
        fill="#fff"
        d="M9.64 16.93a1 1 0 0 1-.71-.3l-3.42-3.42a1 1 0 0 1 1.41-1.41l2.7 2.7 6.42-6.86a1 1 0 1 1 1.46 1.37l-7.13 7.61a1 1 0 0 1-.71.31z"
      />
    </svg>
  )
}

'use client'

import { forwardRef, ImgHTMLAttributes } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  fallback?: string
}

const sizeMap = {
  xs: 24,
  sm: 28,
  md: 38,
  lg: 48,
  xl: 64,
  '2xl': 160,
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt = '', size = 'md', fallback, className }, ref) => {
    const dimension = sizeMap[size]

    // Get initials from fallback or alt
    const getInitials = (name: string): string => {
      if (!name) return '?'
      const parts = name.trim().split(' ')
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }

    const initials = getInitials(fallback || alt)

    const textSizes = {
      xs: 'text-[10px]',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
      '2xl': 'text-4xl',
    }

    if (src) {
      return (
        <div
          ref={ref}
          className={cn('relative overflow-hidden rounded-full bg-[var(--avatar-bg)]', className)}
          style={{ width: dimension, height: dimension }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes={`${dimension}px`}
            className="object-cover"
            unoptimized
          />
        </div>
      )
    }

    // Fallback with initials
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-full bg-[var(--avatar-bg)]',
          textSizes[size],
          'font-instrument font-semibold text-white',
          className
        )}
        style={{ width: dimension, height: dimension }}
      >
        {initials}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
export default Avatar

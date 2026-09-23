'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LoginLayoutProps {
  children: React.ReactNode
  className?: string
}

export function LoginLayout({ children, className }: LoginLayoutProps) {
  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden bg-[#446de5]', className)}>
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#446de5] via-[#446de5] to-[#3a5ed0]"
        aria-hidden="true"
      />

      {/* Logo Section */}
      <div className="relative z-10 flex flex-col items-center pt-[70px]">
        <div className="relative h-[130px] w-[130px]">
          <Image
            src="/images/logo.svg"
            alt="Loot"
            fill
            sizes="130px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

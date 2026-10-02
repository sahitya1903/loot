'use client'

import * as React from 'react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  variantIcons,
} from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function (toastItem) {
        const { id, title, description, action, variant, ...props } = toastItem
        const Icon = variantIcons[variant || 'default']
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <Icon
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  variant === 'success' && 'text-[var(--success)]',
                  variant === 'error' && 'text-[var(--destructive)]',
                  variant === 'warning' && 'text-yellow-500',
                  variant === 'default' && 'text-[var(--foreground)]'
                )}
              />
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

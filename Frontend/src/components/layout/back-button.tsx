'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BackButtonProps {
    onClick?: () => void;
    className?: string;
    variant?: 'light' | 'dark';
}

/**
 * BackButton - Matching Figma design (136:1587)
 * - 42x42 circular button
 * - Chevron left icon
 * - Light variant: white bg with blur
 * - Dark variant: transparent with white icon
 */
export function BackButton({ onClick, className, variant = 'light' }: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.back();
        }
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                'flex h-[42px] w-[42px] items-center justify-center rounded-full transition-opacity hover:opacity-80',
                variant === 'light'
                    ? 'bg-white/80 backdrop-blur-sm'
                    : 'bg-transparent',
                className
            )}
            style={variant === 'light' ? { boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.1)' } : undefined}
            aria-label="Go back"
        >
            <ChevronLeft
                className={cn(
                    'h-6 w-6',
                    variant === 'light' ? 'text-black' : 'text-white'
                )}
            />
        </button>
    );
}

export default BackButton;

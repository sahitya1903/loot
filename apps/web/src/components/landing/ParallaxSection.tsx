'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface ParallaxSectionProps {
    children: ReactNode;
    className?: string;
    /** Parallax intensity - higher = more movement. Default 0.3 */
    intensity?: number;
    /** Whether to show the rounded card border */
    showBorder?: boolean;
}

/**
 * ParallaxSection - Creates a "stacked cards" parallax effect
 * Each section slightly overlays the previous one as you scroll
 * Uses theme-aware colors via CSS variables
 */
export function ParallaxSection({
    children,
    className = '',
    intensity = 0.3,
    showBorder = true,
}: ParallaxSectionProps) {
    const ref = useRef(null);
    const shouldReduceMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    // More significant parallax transforms
    const y = useTransform(
        scrollYProgress,
        [0, 1],
        shouldReduceMotion ? [0, 0] : [120 * intensity, -80 * intensity]
    );

    const scale = useTransform(
        scrollYProgress,
        [0, 0.3, 0.7, 1],
        shouldReduceMotion ? [1, 1, 1, 1] : [0.92, 1, 1, 0.95]
    );

    const rotateX = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        shouldReduceMotion ? [0, 0, 0] : [4, 0, -2]
    );

    const opacity = useTransform(
        scrollYProgress,
        [0, 0.15, 0.85, 1],
        shouldReduceMotion ? [1, 1, 1, 1] : [0.4, 1, 1, 0.5]
    );

    return (
        <motion.div
            ref={ref}
            style={{ y, scale, rotateX, opacity }}
            className={`relative ${className}`}
        >
            {showBorder ? (
                <div
                    className="
                        relative z-10
                        rounded-[24px] sm:rounded-[32px] lg:rounded-[48px] 
                        mx-3 sm:mx-6 lg:mx-12
                        overflow-hidden
                        border border-[var(--border)]
                        shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                        dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
                        bg-[var(--card)]
                        backdrop-blur-sm
                    "
                >
                    {/* Subtle inner glow for depth */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent dark:from-white/[0.02] pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>
            ) : (
                <div className="relative z-10">
                    {children}
                </div>
            )}
        </motion.div>
    );
}

/**
 * Simpler parallax effect for individual elements within sections
 */
interface ParallaxElementProps {
    children: ReactNode;
    className?: string;
    /** Speed multiplier - 1 = normal, 0.5 = half speed (parallax), 1.5 = faster */
    speed?: number;
    /** Direction of parallax movement */
    direction?: 'up' | 'down';
}

export function ParallaxElement({
    children,
    className = '',
    speed = 0.5,
    direction = 'up',
}: ParallaxElementProps) {
    const ref = useRef(null);
    const shouldReduceMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const multiplier = direction === 'up' ? -1 : 1;
    const y = useTransform(
        scrollYProgress,
        [0, 1],
        shouldReduceMotion ? [0, 0] : [150 * speed * multiplier, -150 * speed * multiplier]
    );

    return (
        <motion.div ref={ref} style={{ y }} className={className}>
            {children}
        </motion.div>
    );
}

export default ParallaxSection;

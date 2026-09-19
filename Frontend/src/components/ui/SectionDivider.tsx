'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface SectionDividerProps {
    variant?: 'wave' | 'fade' | 'gradient';
    flip?: boolean;
    className?: string;
}

export function SectionDivider({
    variant = 'gradient',
    flip = false,
    className = '',
}: SectionDividerProps) {
    const shouldReduceMotion = useReducedMotion();

    if (variant === 'wave') {
        return (
            <div className={`relative w-full overflow-hidden ${flip ? 'rotate-180' : ''} ${className}`}>
                <motion.svg
                    viewBox="0 0 1440 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-16 lg:h-20"
                    initial={{ opacity: 0, scaleX: 0.8 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    <path
                        d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
                        fill="var(--border)"
                        fillOpacity="0.3"
                    />
                    <path
                        d="M0 50C240 70 480 20 720 50C960 70 1200 20 1440 50V80H0V50Z"
                        fill="var(--border)"
                        fillOpacity="0.15"
                    />
                </motion.svg>
            </div>
        );
    }

    if (variant === 'fade') {
        return (
            <motion.div
                className={`w-full h-px ${className}`}
                style={{
                    background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
        );
    }

    // gradient variant
    return (
        <motion.div
            className={`w-full h-24 ${className}`}
            style={{
                background: 'linear-gradient(180deg, transparent 0%, var(--border) 50%, transparent 100%)',
                opacity: 0.2,
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.2 }}
            viewport={{ once: true }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
        />
    );
}

'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface TiltCardProps {
    children: ReactNode;
    className?: string;
    intensity?: number;
}

export function TiltCard({
    children,
    className = '',
    intensity = 1,
}: TiltCardProps) {
    const ref = useRef(null);
    const shouldReduceMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const rotateX = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        shouldReduceMotion ? [0, 0, 0] : [5 * intensity, 0, -5 * intensity]
    );

    const rotateY = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        shouldReduceMotion ? [0, 0, 0] : [-3 * intensity, 0, 3 * intensity]
    );

    const scale = useTransform(
        scrollYProgress,
        [0, 0.4, 0.6, 1],
        shouldReduceMotion ? [1, 1, 1, 1] : [0.96, 1, 1, 0.96]
    );

    const shadowY = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        shouldReduceMotion ? [8, 8, 8] : [20, 8, 20]
    );

    const shadowOpacity = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        [0.05, 0.15, 0.05]
    );

    return (
        <motion.div
            ref={ref}
            className={className}
            style={{
                perspective: 1200,
                transformStyle: 'preserve-3d',
            }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    scale,
                    boxShadow: shouldReduceMotion
                        ? '0 8px 30px rgba(0,0,0,0.1)'
                        : `0px ${shadowY}px 40px rgba(0,0,0,${shadowOpacity})`,
                    borderRadius: 'inherit',
                }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

'use client';

import { useEffect, useRef } from 'react';
import {
    motion,
    useMotionValue,
    useTransform,
    animate,
    useInView,
    useReducedMotion,
} from 'framer-motion';

interface AnimatedCounterProps {
    /** Target numeric value to count to */
    value: number;
    /** Text to display before the number (e.g. "$") */
    prefix?: string;
    /** Text to display after the number (e.g. "+", "%", "★") */
    suffix?: string;
    /** Animation duration in seconds */
    duration?: number;
    /** Number of decimal places */
    decimals?: number;
    /** Additional CSS classes */
    className?: string;
}

export function AnimatedCounter({
    value,
    prefix = '',
    suffix = '',
    duration = 2,
    decimals = 0,
    className = '',
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const shouldReduceMotion = useReducedMotion();
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    const rounded = useTransform(motionValue, (latest) => {
        if (decimals > 0) {
            return latest.toFixed(decimals);
        }
        return Math.round(latest).toLocaleString();
    });

    useEffect(() => {
        if (!isInView) return;

        if (shouldReduceMotion) {
            motionValue.set(value);
            return;
        }

        const controls = animate(motionValue, value, {
            duration,
            ease: [0.22, 1, 0.36, 1],
        });

        return () => controls.stop();
    }, [isInView, value, duration, motionValue, shouldReduceMotion]);

    return (
        <span ref={ref} className={className}>
            {prefix}
            <motion.span>{rounded}</motion.span>
            {suffix}
        </span>
    );
}

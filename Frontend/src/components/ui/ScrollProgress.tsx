'use client';

import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';

export function ScrollProgress() {
    const shouldReduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    if (shouldReduceMotion) return null;

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 z-[100] h-[3px] origin-left"
            style={{
                scaleX,
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            }}
        />
    );
}

'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface MeshGradientProps {
    colors?: string[];
    opacity?: number;
    className?: string;
}

const blobConfigs = [
    { size: '60%', top: '-10%', left: '-10%', duration: 18 },
    { size: '50%', top: '50%', right: '-15%', duration: 22 },
    { size: '45%', bottom: '-10%', left: '30%', duration: 20 },
    { size: '35%', top: '20%', left: '50%', duration: 16 },
];

export function MeshGradient({
    colors = ['var(--primary)', 'var(--accent)', 'var(--primary)', 'var(--accent)'],
    opacity = 0.12,
    className = '',
}: MeshGradientProps) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <div
            className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
            style={{ opacity }}
        >
            {blobConfigs.map((config, i) => {
                const { size, duration, ...position } = config;
                const color = colors[i % colors.length];

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: size,
                            height: size,
                            ...position,
                            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                            filter: 'blur(60px)',
                            willChange: shouldReduceMotion ? 'auto' : 'transform',
                        }}
                        animate={
                            shouldReduceMotion
                                ? undefined
                                : {
                                      x: [0, 30, -20, 0],
                                      y: [0, -25, 15, 0],
                                      scale: [1, 1.1, 0.95, 1],
                                  }
                        }
                        transition={
                            shouldReduceMotion
                                ? undefined
                                : {
                                      duration,
                                      ease: 'easeInOut',
                                      repeat: Infinity,
                                      repeatType: 'reverse',
                                  }
                        }
                    />
                );
            })}
        </div>
    );
}

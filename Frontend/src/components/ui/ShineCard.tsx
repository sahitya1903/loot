'use client';

import { useRef, useState, useCallback, MouseEvent, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ShineCardProps {
    children: ReactNode;
    className?: string;
    shineOpacity?: number;
}

export function ShineCard({
    children,
    className = '',
    shineOpacity = 0.08,
}: ShineCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const shouldReduceMotion = useReducedMotion();
    const [shinePosition, setShinePosition] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            if (shouldReduceMotion || !ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setShinePosition({ x, y });
        },
        [shouldReduceMotion]
    );

    return (
        <div
            ref={ref}
            className={`relative overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
            {!shouldReduceMotion && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(600px circle at ${shinePosition.x}% ${shinePosition.y}%, rgba(255,255,255,${shineOpacity}), transparent 40%)`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                />
            )}
        </div>
    );
}

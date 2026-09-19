'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

// Page transition variants
const pageVariants = {
    initial: {
        opacity: 0,
        y: 12,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1] as const,
            staggerChildren: 0.08,
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: {
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1] as const,
        },
    },
};

// For staggering child elements
const itemVariants = {
    initial: { opacity: 0, y: 16 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1] as const,
        },
    },
};

/**
 * PageTransition - Wraps page content with smooth enter/exit animations
 * 
 * Usage:
 * ```tsx
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 * ```
 */
export function PageTransition({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * MotionItem - Use inside PageTransition for staggered children
 * 
 * Usage:
 * ```tsx
 * <PageTransition>
 *   {items.map((item, i) => (
 *     <MotionItem key={i}>
 *       <Card>{item}</Card>
 *     </MotionItem>
 *   ))}
 * </PageTransition>
 * ```
 */
export function MotionItem({ children, className }: PageTransitionProps) {
    return (
        <motion.div variants={itemVariants} className={className}>
            {children}
        </motion.div>
    );
}

/**
 * FadeIn - Simple fade in animation
 */
export function FadeIn({ children, className, delay = 0 }: PageTransitionProps & { delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * SlideUp - Slide up with fade animation
 */
export function SlideUp({ children, className, delay = 0 }: PageTransitionProps & { delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * ScaleIn - Scale in with fade animation
 */
export function ScaleIn({ children, className, delay = 0 }: PageTransitionProps & { delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay, ease: [0.34, 1.56, 0.64, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Re-export motion for convenience
export { motion, AnimatePresence };

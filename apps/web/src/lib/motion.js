// ============================================
// CORE EASING & TIMING
// ============================================

/**
 * Primary easing curve - smooth, natural deceleration
 * Equivalent to cubic-bezier(0.22, 1, 0.36, 1)
 */
export const ease = {
  smooth: [0.22, 1, 0.36, 1],
  spring: [0.34, 1.56, 0.64, 1],
  linear: [0, 0, 1, 1],
  magneticSnap: [0.25, 0.46, 0.45, 0.94],
  textReveal: [0.77, 0, 0.175, 1],
}

/**
 * Duration tokens (in seconds)
 */
export const duration = {
  micro: 0.14, // 140ms - hover, active states
  fast: 0.18, // 180ms - micro interactions
  normal: 0.4, // 400ms - section reveals
  slow: 0.6, // 600ms - hero entrance
  ambient: 12, // 12s - floating loops
}

/**
 * Stagger delays (in seconds)
 */
export const stagger = {
  fast: 0.08, // 80ms between items
  normal: 0.12, // 120ms between items
  slow: 0.2, // 200ms between items
}

// ============================================
// SHARED TRANSITIONS
// ============================================

export const transitions = {
  /** Standard section reveal */
  reveal: {
    duration: duration.normal,
    ease: ease.smooth,
  },

  /** Hero-level entrance */
  hero: {
    duration: duration.slow,
    ease: ease.smooth,
  },

  /** Micro interactions (hover, active) */
  micro: {
    duration: duration.micro,
    ease: ease.smooth,
  },

  /** Ambient floating animation */
  ambient: {
    duration: duration.ambient,
    ease: 'easeInOut',
    repeat: Infinity,
    repeatType: 'reverse',
  },
}

// ============================================
// VIEWPORT CONFIG
// ============================================

/**
 * Standard viewport trigger for scroll animations
 * Triggers when element reaches ~65% viewport height
 */
export const viewportConfig = {
  once: true,
  amount: 0.35, // Triggers at ~65% viewport
}

/**
 * Earlier trigger for hero/above-the-fold content
 */
export const heroViewportConfig = {
  once: true,
  amount: 0.1,
}

// ============================================
// SECTION REVEAL VARIANTS
// ============================================

/**
 * Standard section entrance
 * - Fades in from below
 * - No bounce, no overshoot
 */
export const sectionReveal = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.reveal,
  },
}

/**
 * Container for staggered children
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.normal,
      delayChildren: 0,
    },
  },
}

/**
 * Hero container - faster stagger for immediate impact
 */
export const heroContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.normal,
      delayChildren: 0,
    },
  },
}

// ============================================
// TEXT HIERARCHY VARIANTS
// ============================================

/**
 * Headline - appears first
 */
export const headlineReveal = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: ease.smooth,
    },
  },
}

/**
 * Subtext - follows headline
 */
export const subtextReveal = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: ease.smooth,
    },
  },
}

/**
 * CTA buttons - appears last with micro-rise
 */
export const ctaReveal = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.fast,
      ease: ease.smooth,
    },
  },
}

// ============================================
// VISUAL ELEMENT VARIANTS
// ============================================

/**
 * Images/mockups - scale in with soft shadow
 */
export const visualReveal = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      ease: ease.smooth,
      delay: stagger.slow, // Enters after text
    },
  },
}

/**
 * Floating decorative elements
 */
export const floatingElement = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.normal,
      ease: ease.smooth,
    },
  },
}

// ============================================
// AMBIENT MOTION (FLOAT)
// ============================================

/**
 * Subtle Y-axis float for premium feel
 * Movement: ±4px over 10-14s
 */
export const ambientFloat = {
  y: [0, -4, 0],
  transition: {
    duration: duration.ambient,
    ease: 'easeInOut',
    repeat: Infinity,
  },
}

/**
 * Slightly offset float for layered depth
 */
export const ambientFloatOffset = {
  y: [0, 4, 0],
  transition: {
    duration: duration.ambient + 2,
    ease: 'easeInOut',
    repeat: Infinity,
  },
}

// ============================================
// HOVER & MICRO-INTERACTIONS
// ============================================

/**
 * Button hover/tap states
 */
export const buttonInteraction = {
  rest: { scale: 1 },
  hover: {
    scale: 1.025,
    transition: transitions.micro,
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
}

/**
 * Card/floating item hover
 * Includes translateY and shadow increase
 */
export const cardInteraction = {
  rest: {
    y: 0,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -3,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    transition: transitions.micro,
  },
}

/**
 * Link hover - subtle opacity shift
 */
export const linkInteraction = {
  rest: { opacity: 1 },
  hover: {
    opacity: 0.8,
    transition: { duration: 0.1 },
  },
}

// ============================================
// CONNECTED/SCATTERED ELEMENTS
// ============================================

/**
 * Scattered avatar entrance - staggered from center
 */
export const scatteredReveal = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.normal,
      ease: ease.smooth,
      delay: delay * stagger.normal,
    },
  }),
}

// ============================================
// CHARACTER REVEAL & MAGNETIC VARIANTS
// ============================================

/**
 * Character-level staggered text reveal
 */
export const characterReveal = {
  hidden: {
    opacity: 0,
    y: 20,
    rotateX: -60,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      duration: duration.normal,
      ease: ease.textReveal,
    },
  },
}

/**
 * Magnetic hover interaction (spring physics)
 */
export const magneticHover = {
  rest: { x: 0, y: 0 },
  hover: {
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 15,
    },
  },
}

/**
 * Nav morph variant for scroll-based nav changes
 */
export const navMorph = {
  initial: {
    padding: '20px 24px',
    backdropFilter: 'blur(16px)',
  },
  scrolled: {
    padding: '12px 20px',
    backdropFilter: 'blur(24px)',
    transition: {
      duration: duration.normal,
      ease: ease.smooth,
    },
  },
}

/**
 * Typing indicator - bouncing dots
 */
export const typingDot = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: [0.3, 1, 0.3],
    y: [0, -4, 0],
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
      repeat: Infinity,
      delay: i * 0.15,
    },
  }),
}

/**
 * Glow border rotation animation
 */
export const glowBorder = {
  rotate: [0, 360],
  transition: {
    duration: 8,
    ease: 'linear',
    repeat: Infinity,
  },
}

/**
 * Avatar pulse animation
 */
export const avatarPulse = {
  scale: [1, 1.08, 1],
  transition: {
    duration: 3,
    ease: 'easeInOut',
    repeat: Infinity,
  },
}

// ============================================
// ACCESSIBILITY: REDUCED MOTION
// ============================================

/**
 * Reduced motion variants - minimal/no animation
 * Use with: @media (prefers-reduced-motion: reduce)
 */
export const reducedMotion = {
  section: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.01 },
    },
  },
  noAnimation: {
    hidden: {},
    visible: {},
  },
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get appropriate variants based on motion preference
 */
export const getMotionVariants = (standard, reduced = reducedMotion.section) => {
  return prefersReducedMotion() ? reduced : standard
}

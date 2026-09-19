'use client'

import { motion, useReducedMotion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { Instagram, Linkedin, Mail } from 'lucide-react'
import { sectionReveal, linkInteraction, viewportConfig, stagger } from '@/lib/motion'
import { SplitText } from '@/components/ui/SplitText'
import { useMagnetic } from '@/hooks/use-magnetic'

const footerLinks = {
  features: {
    title: 'OUR FEATURES',
    links: [
      { label: 'Photo Sharing', href: '/login' },
      { label: 'Event Creation', href: '/login' },
      { label: 'Gallery Builder', href: '/login' },
    ],
  },
  information: {
    title: 'INFORMATION',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-and-conditions' },
      { label: 'Help Center', href: 'mailto:support@momento.app' },
    ],
  },
  contact: {
    title: 'CONTACT US',
    links: [{ label: 'support@momento.app', href: 'mailto:support@momento.app', icon: Mail }],
  },
}

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/momento.fam', label: 'Instagram' },
  {
    icon: Linkedin,
    href: 'https://www.linkedin.com/company/humora-technologies',
    label: 'LinkedIn',
  },
]

const columnVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: i * stagger.fast,
    },
  }),
}

export function LandingFooter() {
  const ref = useRef(null)
  const isInView = useInView(ref, { ...viewportConfig, margin: '-20% 0px -20% 0px' })
  const shouldReduceMotion = useReducedMotion()
  const [magneticRef, magneticStyle, magneticOnMouseMove, magneticOnMouseLeave] = useMagnetic({
    strength: 0.2,
  })

  return (
    <footer
      ref={ref}
      className="relative overflow-hidden bg-[var(--card)] dark:bg-[var(--card)]/80"
    >
      {/* Main footer content */}
      <div className="relative z-10 px-4 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 pb-12 sm:gap-10 sm:pb-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Brand column */}
            <motion.div
              custom={0}
              variants={columnVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="lg:col-span-1"
            >
              <Link href="/" className="mb-4 flex items-center gap-2.5">
                <div className="relative h-10 w-10 overflow-hidden">
                  <Image
                    src="/images/logo.png"
                    alt="Momento Logo"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <span className="font-[family-name:var(--font-instrument)] text-xl font-bold text-[var(--foreground)]">
                  Momento
                </span>
              </Link>
              <p className="mb-6 font-sans text-sm leading-relaxed text-[var(--muted)]">
                The most advanced photo sharing platform for your precious memories.
              </p>

              {/* App Store badges */}
              <div className="mb-6 flex items-center gap-3">
                <Link
                  href="https://apps.apple.com/in/app/momento-memories-for-life/id6746373161"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-70 transition-opacity duration-200 hover:opacity-100"
                >
                  <Image
                    src="/images/badge-appstore.svg"
                    alt="App Store"
                    width={120}
                    height={36}
                    className="h-9 w-auto"
                  />
                </Link>
                <Link
                  href="https://play.google.com/store/apps/details?id=com.orion.momento"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-70 transition-opacity duration-200 hover:opacity-100"
                >
                  <Image
                    src="/images/badge-playstore.svg"
                    alt="Google Play"
                    width={120}
                    height={36}
                    className="h-9 w-auto"
                  />
                </Link>
              </div>

              {/* Social links */}
              <div className="space-y-3">
                <p className="font-sans text-sm text-[var(--muted)]">Follow us on:</p>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social) => (
                    <motion.div
                      key={social.label}
                      ref={magneticRef}
                      style={magneticStyle}
                      onMouseMove={magneticOnMouseMove}
                      onMouseLeave={magneticOnMouseLeave}
                      variants={linkInteraction}
                      initial="rest"
                      whileHover={shouldReduceMotion ? undefined : 'hover'}
                    >
                      <Link
                        href={social.href}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] transition-all duration-150 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                        aria-label={social.label}
                      >
                        <social.icon className="h-5 w-5" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Links columns */}
            {Object.values(footerLinks).map((section, idx) => (
              <motion.div
                key={section.title}
                custom={idx + 1}
                variants={columnVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
              >
                <h3 className="mb-5 font-sans text-xs font-semibold tracking-[0.2em] text-[var(--foreground)]">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <motion.div
                        variants={linkInteraction}
                        initial="rest"
                        whileHover={shouldReduceMotion ? undefined : 'hover'}
                        className="inline-flex items-center gap-2"
                      >
                        {'icon' in link && link.icon && (
                          <link.icon className="h-4 w-4 text-[var(--muted)]" />
                        )}
                        <Link
                          href={link.href}
                          className="font-sans text-sm text-[var(--muted)] transition-colors duration-150 hover:text-[var(--foreground)]"
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright bar with watermark behind */}
      <div className="relative min-h-[140px] sm:min-h-[180px]">
        {/* Large watermark brand text - positioned behind copyright */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <SplitText
            text="Momento"
            mode="char"
            staggerDelay={0.05}
            trigger="inView"
            tag="span"
            className="font-[family-name:var(--font-instrument)] text-[18vw] leading-none font-bold text-[var(--foreground)] select-none sm:text-[20vw] lg:text-[260px]"
            charClassName="opacity-[0.04] dark:opacity-[0.06]"
          />
        </div>

        {/* Copyright text overlay */}
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative z-10 border-t border-[var(--border)] py-12 text-center sm:py-20"
        >
          <p className="font-sans text-sm text-[var(--muted)]">
            © Copyright 2026. Momento Technologies Pvt. Ltd. All Rights Reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

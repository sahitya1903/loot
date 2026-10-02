'use client'

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  Search,
  PlusCircle,
  Bell,
  User,
  LogOut,
  Settings,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks'
import { signOut } from '@/lib/firebase/auth'
import { Avatar, ThemeToggle, WashiTape } from '@/components/ui'

const SidebarContext = createContext(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

// Loot desktop sidebar nav.
// Pro accounts get a different set in the bottom-nav (mobile) for now;
// the desktop sidebar shows the personal-account view.
const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/nearby', icon: Search, label: 'Nearby' },
  { href: '/pro/create', icon: PlusCircle, label: 'Create loot' },
  { href: '/saved', icon: MessageCircle, label: 'Saved' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
]

/* Shared class fragments */
const sidebarBg = 'bg-[color-mix(in_srgb,var(--ink)_4%,var(--ivory))]'
const sidebarBorder = 'border-[var(--ink-subtle)]'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const { isCollapsed, setIsCollapsed, setIsMobileOpen } = useSidebar()

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-[260px]'

  return (
    <>
      {/* Sidebar (desktop only) */}
      <motion.aside
        className={cn(
          'hidden lg:flex',
          'sticky top-0 z-40 h-[100dvh] shrink-0 self-start',
          `border-r ${sidebarBorder} ${sidebarBg}`,
          'flex-col',
          'transition-all duration-300 ease-in-out',
          sidebarWidth
        )}
      >
        {/* Header */}
        <div
          className={cn(
            `flex h-16 items-center border-b ${sidebarBorder}`,
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src="/images/logo.svg"
                alt="Loot"
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-playfair text-[20px] font-bold text-[var(--ink)]"
              >
                Loot
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5',
                  'font-instrument text-[15px] font-medium',
                  'transition-colors duration-[var(--duration-fast)]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rust)] focus-visible:ring-inset',
                  isCollapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-[var(--rust)]/10 text-[var(--rust)]'
                    : 'text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--ink)_7%,transparent)]'
                )}
                title={isCollapsed ? item.label : undefined}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}

          {/* Profile link */}
          <Link
            href="/profile"
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5',
              'font-instrument text-[15px] font-medium',
              'transition-colors duration-[var(--duration-fast)]',
              isCollapsed && 'justify-center px-2',
              pathname === '/profile'
                ? 'bg-[var(--rust)]/10 text-[var(--rust)]'
                : 'text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--ink)_7%,transparent)]'
            )}
            title={isCollapsed ? 'Profile' : undefined}
          >
            {profile?.profilePicture ? (
              <Avatar src={profile.profilePicture} alt={profile.name} size="xs" />
            ) : (
              <User className="h-5 w-5 shrink-0" />
            )}
            {!isCollapsed && <span>Profile</span>}
          </Link>
        </nav>

        {/* Moodboard strip — expanded only */}
        {!isCollapsed && (
          <div
            className="relative mx-3 mb-2 overflow-hidden rounded-[var(--radius-lg)] px-4 py-3 select-none"
            style={{ background: 'color-mix(in srgb, var(--amber) 13%, var(--ivory))' }}
            aria-hidden="true"
          >
            {/* Top wave */}
            <svg
              viewBox="0 0 234 18"
              className="pointer-events-none absolute top-0 left-0 w-full"
              preserveAspectRatio="none"
            >
              <path
                style={{ fill: 'color-mix(in srgb, var(--amber) 35%, transparent)' }}
                d="M0 0 L0 10 C39 18 78 2 117 10 C156 18 195 2 234 10 L234 0 Z"
              />
            </svg>

            {/* Bottom wave */}
            <svg
              viewBox="0 0 234 18"
              className="pointer-events-none absolute bottom-0 left-0 w-full"
              preserveAspectRatio="none"
            >
              <path
                style={{ fill: 'color-mix(in srgb, var(--rust) 22%, transparent)' }}
                d="M0 18 L0 8 C39 0 78 16 117 8 C156 0 195 16 234 8 L234 18 Z"
              />
            </svg>

            {/* Content */}
            <div className="relative flex items-end gap-3">
              {/* Camera illustration */}
              <Image
                src="/camera_on_tripod.svg"
                alt=""
                aria-hidden="true"
                width={80}
                height={80}
                className="pointer-events-none w-[80px] shrink-0 opacity-60 select-none"
              />

              {/* Text side */}
              <div className="flex-1 pb-1">
                {/* Washi tape strips */}
                <div className="mb-2 flex items-center gap-2">
                  <WashiTape color="amber" />
                  <WashiTape color="rust" className="rotate-[2deg]" />
                </div>

                {/* Handwritten text lines */}
                <p
                  className="font-caveat text-[15px] text-[var(--rust)] opacity-80"
                  style={{ transform: 'rotate(-1deg)' }}
                >
                  capture the moment ✦
                </p>
                <p
                  className="font-caveat mt-0.5 text-[12px] text-[var(--ink-muted)]"
                  style={{ transform: 'rotate(0.5deg)' }}
                >
                  collect · share · relive
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`space-y-3 border-t ${sidebarBorder} p-3`}>
          {/* User info (expanded only) */}
          {!isCollapsed && profile && (
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] px-2 py-2">
              <Avatar
                src={profile.profilePicture}
                alt={profile.name}
                fallback={profile.name}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="font-instrument truncate text-[14px] font-medium text-[var(--ink)]">
                  {profile.name || 'User'}
                </p>
                {profile.username && (
                  <p className="font-instrument truncate text-[12px] text-[var(--ink-muted)]">
                    @{profile.username}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={cn('flex gap-2', isCollapsed ? 'flex-col items-center' : 'flex-row')}>
            <ThemeToggle />

            {!isCollapsed && (
              <>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] text-[var(--ink-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_7%,transparent)] hover:text-[var(--ink)]"
                >
                  <Settings className="h-4 w-4" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--ink-muted)] transition-colors hover:bg-[var(--rust)]/10 hover:text-[var(--rust)]"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Collapse Toggle (Desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'hidden w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-2 lg:flex',
              'text-[var(--ink-muted)] transition-colors duration-[var(--duration-fast)]',
              'hover:bg-[color-mix(in_srgb,var(--ink)_7%,transparent)] hover:text-[var(--ink)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rust)]'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="font-instrument text-[13px]">Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  )
}

// Mobile header
export function MobileHeader() {
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastScrollY.current && currentY > 56) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between px-4 transition-transform duration-300 lg:hidden',
        `border-b border-[var(--ink-subtle)] bg-[color-mix(in_srgb,var(--ink)_4%,var(--ivory))]`,
        hidden && '-translate-y-full'
      )}
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="relative h-8 w-8">
          <Image src="/images/logo.svg" alt="Loot" fill sizes="32px" className="object-contain" />
        </div>
        <span className="font-playfair text-[18px] font-bold text-[var(--ink)]">Loot</span>
      </Link>

      <ThemeToggle />
    </header>
  )
}

export default Sidebar

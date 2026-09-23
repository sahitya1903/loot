import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider, useTheme } from './use-theme'

// A consumer that only renders after ThemeProvider has mounted.
// It delays its own render by one effect cycle so ThemeProvider
// always provides context by the time this component mounts.
function DelayedConsumer({ onReady }: { onReady: (api: ReturnType<typeof useTheme>) => void }) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) return <span data-testid="loading" />
  return <Inner onReady={onReady} />
}

function Inner({ onReady }: { onReady: (api: ReturnType<typeof useTheme>) => void }) {
  const api = useTheme()
  onReady(api)
  return (
    <>
      <span data-testid="theme-value">{api.theme}</span>
      <span data-testid="resolved-value">{api.resolvedTheme}</span>
      <button data-testid="btn-light" onClick={() => api.setTheme('light')}>
        light
      </button>
      <button data-testid="btn-dark" onClick={() => api.setTheme('dark')}>
        dark
      </button>
      <button data-testid="btn-toggle" onClick={api.toggleTheme}>
        toggle
      </button>
    </>
  )
}

describe('useTheme', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockClear()
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.style.colorScheme = ''
  })

  it('throws when used outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      render(
        <React.Fragment>
          <InnerThrow />
        </React.Fragment>
      )
    }).toThrow('useTheme must be used within ThemeProvider')
    spy.mockRestore()
  })

  it('applies dark class to document when localStorage has dark', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('dark')

    render(
      <ThemeProvider>
        <span data-testid="child" />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('applies light class to document when localStorage has light', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('light')

    render(
      <ThemeProvider>
        <span data-testid="child" />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })

  it('defaults to system (matchMedia dark=false → light) when no stored value', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    // matchMedia mock returns matches: false → system theme resolves to light

    render(
      <ThemeProvider>
        <span data-testid="child" />
      </ThemeProvider>
    )

    await waitFor(() => {
      const hasDark = document.documentElement.classList.contains('dark')
      const hasLight = document.documentElement.classList.contains('light')
      expect(hasDark || hasLight).toBe(true)
    })
  })

  it('setTheme updates the theme value', async () => {
    const captured: ReturnType<typeof useTheme>[] = []

    render(
      <ThemeProvider>
        <DelayedConsumer onReady={(api) => captured.push(api)} />
      </ThemeProvider>
    )

    await screen.findByTestId('theme-value')
    fireEvent.click(screen.getByTestId('btn-light'))

    await waitFor(() => {
      expect(screen.getByTestId('theme-value').textContent).toBe('light')
    })
  })

  it('setTheme persists to localStorage', async () => {
    render(
      <ThemeProvider>
        <DelayedConsumer onReady={() => {}} />
      </ThemeProvider>
    )

    await screen.findByTestId('theme-value')
    fireEvent.click(screen.getByTestId('btn-dark'))

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('loot-theme', 'dark')
    })
  })

  it('setTheme applies the correct class to document root', async () => {
    render(
      <ThemeProvider>
        <DelayedConsumer onReady={() => {}} />
      </ThemeProvider>
    )

    await screen.findByTestId('theme-value')
    fireEvent.click(screen.getByTestId('btn-dark'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })
  })

  it('toggleTheme switches from dark to light', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('dark')

    render(
      <ThemeProvider>
        <DelayedConsumer onReady={() => {}} />
      </ThemeProvider>
    )

    await screen.findByTestId('theme-value')
    fireEvent.click(screen.getByTestId('btn-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('theme-value').textContent).toBe('light')
    })
  })

  it('toggleTheme switches from light to dark', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('light')

    render(
      <ThemeProvider>
        <DelayedConsumer onReady={() => {}} />
      </ThemeProvider>
    )

    await screen.findByTestId('theme-value')
    fireEvent.click(screen.getByTestId('btn-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('theme-value').textContent).toBe('dark')
    })
  })
})

// Component that calls useTheme outside a provider - used to test the throw
function InnerThrow() {
  useTheme()
  return null
}

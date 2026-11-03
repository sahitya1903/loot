import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/navigation', () => ({ useParams: () => ({ section: ['dashboard'] }) }))
vi.mock('@loot/shared/api', () => ({ chooseAccountType: vi.fn() }))

import { chooseAccountType } from '@loot/shared/api'
import { useAuthStore } from '@/stores/auth'
import ProPage from './page'

const signInAs = (profile) => useAuthStore.setState({ profile })

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().reset()
})

describe('ProPage', () => {
  it('explains how a personal account sets up a business in the app', () => {
    signInAs({ userId: 'u1', accountType: 'personal', businessId: null })
    render(<ProPage />)
    expect(screen.getByRole('heading', { name: 'Business dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Set up a business account')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse the feed' })).toHaveAttribute('href', '/feed')
  })

  it('links a business owner to their business page', () => {
    signInAs({ userId: 'u1', accountType: 'professional', businessId: 'b1' })
    render(<ProPage />)
    expect(screen.getByRole('link', { name: 'View your business page' })).toHaveAttribute(
      'href',
      '/business/b1'
    )
  })

  it('lets a business account without a business switch back to personal', async () => {
    signInAs({ userId: 'u1', accountType: 'professional', businessId: null })
    chooseAccountType.mockResolvedValue({
      user: { userId: 'u1', accountType: 'personal', businessId: null },
    })
    render(<ProPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Switch to a personal account' }))
    expect(chooseAccountType).toHaveBeenCalledWith({ accountType: 'personal' })
    expect(useAuthStore.getState().profile.accountType).toBe('personal')
    expect(await screen.findByRole('link', { name: 'Browse the feed' })).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/hooks', () => ({ useAuth: () => ({ clearNewUserFlag: vi.fn() }) }))
vi.mock('@loot/shared/api', () => ({ chooseAccountType: vi.fn() }))

import { chooseAccountType } from '@loot/shared/api'
import OnboardingPage from './page'

beforeEach(() => {
  vi.clearAllMocks()
  chooseAccountType.mockResolvedValue({ user: { userId: 'u1', accountType: 'personal' } })
})

describe('OnboardingPage', () => {
  it('sends discoverers to the feed', async () => {
    render(<OnboardingPage />)
    await userEvent.click(screen.getByRole('button', { name: /here to discover/i }))
    expect(chooseAccountType).toHaveBeenCalledWith({ accountType: 'personal' })
    expect(push).toHaveBeenCalledWith('/feed')
  })

  it('keeps businesses on a personal account and shows them how to set up', async () => {
    render(<OnboardingPage />)
    await userEvent.click(screen.getByRole('button', { name: /run a business/i }))
    expect(chooseAccountType).toHaveBeenCalledWith({ accountType: 'personal' })
    expect(push).toHaveBeenCalledWith('/pro/dashboard')
  })
})

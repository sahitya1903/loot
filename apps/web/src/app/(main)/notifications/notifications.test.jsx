import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@loot/shared'

vi.mock('@loot/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  listLootAlerts: vi.fn(),
}))

import { listLootAlerts } from '@loot/shared/api'
import { useAuthStore } from '@/stores/auth'
import NotificationsPage from './page'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <NotificationsPage />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ profile: { userId: 'u1', accountType: 'personal' } })
})

describe('NotificationsPage', () => {
  it('says "coming soon" when the API has no alerts endpoint yet, without retrying', async () => {
    listLootAlerts.mockRejectedValue(new ApiError(404, 'not_found', 'Not found'))
    renderPage()
    expect(await screen.findByText('Notifications are coming soon')).toBeInTheDocument()
    expect(listLootAlerts).toHaveBeenCalledTimes(1)
  })

  it('offers a retry on other errors', async () => {
    listLootAlerts.mockRejectedValue(new ApiError(500, 'internal', 'Boom'))
    renderPage()
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('lists alerts', async () => {
    listLootAlerts.mockResolvedValue({
      items: [{ alertId: 'a1', title: 'Cold brew ending soon', body: '20 min left', lootId: 'l1' }],
      cursor: null,
    })
    renderPage()
    expect(await screen.findByText('Cold brew ending soon')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@loot/shared'

vi.mock('@loot/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  listLootAlerts: vi.fn(),
  markAlertRead: vi.fn(),
  markAllAlertsRead: vi.fn(),
}))

import { listLootAlerts, markAlertRead, markAllAlertsRead } from '@loot/shared/api'
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
  it('shows an empty state', async () => {
    listLootAlerts.mockResolvedValue({ items: [], cursor: null, unreadCount: 0 })
    renderPage()
    expect(await screen.findByText('All quiet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument()
  })

  it('offers a retry on other errors', async () => {
    listLootAlerts.mockRejectedValue(new ApiError(500, 'internal', 'Boom'))
    renderPage()
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('lists alerts and marks one read when opened', async () => {
    listLootAlerts.mockResolvedValue({
      items: [
        {
          alertId: 'a1',
          title: 'Cold brew ending soon',
          body: '20 min left',
          lootId: 'l1',
          readAt: null,
        },
      ],
      cursor: null,
      unreadCount: 1,
    })
    markAlertRead.mockResolvedValue({})
    renderPage()
    await userEvent.click(await screen.findByText('Cold brew ending soon'))
    expect(markAlertRead).toHaveBeenCalledWith('a1')
  })

  it('marks everything read', async () => {
    listLootAlerts.mockResolvedValue({
      items: [{ alertId: 'a1', title: 'Drop', body: 'New loot', lootId: 'l1', readAt: null }],
      cursor: null,
      unreadCount: 1,
    })
    markAllAlertsRead.mockResolvedValue({ updated: 1 })
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Mark all read' }))
    await waitFor(() => expect(markAllAlertsRead).toHaveBeenCalled())
  })
})

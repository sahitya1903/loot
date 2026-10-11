/** Real-time publisher used when Socket.io is not attached (tests, scripts). */
export const noopRealtime = {
  lootCounters() {},
  lootPublished() {},
}

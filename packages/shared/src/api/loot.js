// Loot — CRUD + interactions API client.

import { callFunction } from '../client.js'

export function createLoot(req) {
  return callFunction('createLoot', req)
}

export function updateLoot(req) {
  return callFunction('updateLoot', req)
}

export function archiveLoot(req) {
  return callFunction('archiveLoot', req)
}

export function attachLootMedia(req) {
  return callFunction('attachLootMedia', req)
}

export function getLoot(req) {
  return callFunction('getLoot', req)
}

export function getLootMediaUrls(req) {
  return callFunction('getLootMediaUrls', req)
}

export function trackLootView(req) {
  return callFunction('trackLootView', req)
}

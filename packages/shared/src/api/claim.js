// Loot — claim / save / share / redemption.

import { callFunction } from '../client.js'

export function claimLoot(req) {
  return callFunction('claimLoot', req)
}

export function saveLoot(req) {
  return callFunction('saveLoot', req)
}

export function unsaveLoot(req) {
  return callFunction('unsaveLoot', req)
}

export function shareLoot(req) {
  return callFunction('shareLoot', req)
}

export function reviewLoot(req) {
  return callFunction('reviewLoot', req)
}

export function getRedemptionByLoot(lootId) {
  return callFunction('getRedemptionByLoot', { lootId })
}

export function getMySavedLoot(req = {}) {
  return callFunction('getMySavedLoot', req)
}

export function getMyClaimedLoot(req = {}) {
  return callFunction('getMyClaimedLoot', req)
}

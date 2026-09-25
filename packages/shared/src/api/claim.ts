// Loot — claim / save / share / redemption.

import { callFunction } from '../client'
import type {
  ClaimLootRequest, ClaimLootResponse,
  SaveLootRequest, UnsaveLootRequest,
  ShareLootRequest,
  ReviewLootRequest,
  GetMySavedLootRequest, GetMySavedLootResponse,
  GetMyClaimedLootRequest, GetMyClaimedLootResponse,
  GetRedemptionResponse,
  GenericResponse,
} from '../types'

export function claimLoot(req: ClaimLootRequest) {
  return callFunction<ClaimLootRequest, ClaimLootResponse>('claimLoot', req)
}

export function saveLoot(req: SaveLootRequest) {
  return callFunction<SaveLootRequest, GenericResponse>('saveLoot', req)
}

export function unsaveLoot(req: UnsaveLootRequest) {
  return callFunction<UnsaveLootRequest, GenericResponse>('unsaveLoot', req)
}

export function shareLoot(req: ShareLootRequest) {
  return callFunction<ShareLootRequest, GenericResponse>('shareLoot', req)
}

export function reviewLoot(req: ReviewLootRequest) {
  return callFunction<ReviewLootRequest, GenericResponse>('reviewLoot', req)
}

export function getRedemptionByLoot(lootId: string) {
  return callFunction<{ lootId: string }, GetRedemptionResponse>('getRedemptionByLoot', { lootId })
}

export function getMySavedLoot(req: GetMySavedLootRequest = {}) {
  return callFunction<GetMySavedLootRequest, GetMySavedLootResponse>('getMySavedLoot', req)
}

export function getMyClaimedLoot(req: GetMyClaimedLootRequest = {}) {
  return callFunction<GetMyClaimedLootRequest, GetMyClaimedLootResponse>('getMyClaimedLoot', req)
}

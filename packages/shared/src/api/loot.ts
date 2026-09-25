// Loot — CRUD + interactions API client.

import { callFunction } from '../client'
import type {
  CreateLootRequest, CreateLootResponse,
  UpdateLootRequest, UpdateLootResponse,
  ArchiveLootRequest,
  AttachLootMediaRequest,
  GetLootRequest, GetLootResponse,
  GetLootMediaUrlsRequest, GetLootMediaUrlsResponse,
  TrackLootViewRequest,
  GenericResponse,
} from '../types'

export function createLoot(req: CreateLootRequest) {
  return callFunction<CreateLootRequest, CreateLootResponse>('createLoot', req)
}

export function updateLoot(req: UpdateLootRequest) {
  return callFunction<UpdateLootRequest, UpdateLootResponse>('updateLoot', req)
}

export function archiveLoot(req: ArchiveLootRequest) {
  return callFunction<ArchiveLootRequest, GenericResponse>('archiveLoot', req)
}

export function attachLootMedia(req: AttachLootMediaRequest) {
  return callFunction<AttachLootMediaRequest, GenericResponse>('attachLootMedia', req)
}

export function getLoot(req: GetLootRequest) {
  return callFunction<GetLootRequest, GetLootResponse>('getLoot', req)
}

export function getLootMediaUrls(req: GetLootMediaUrlsRequest) {
  return callFunction<GetLootMediaUrlsRequest, GetLootMediaUrlsResponse>('getLootMediaUrls', req)
}

export function trackLootView(req: TrackLootViewRequest) {
  return callFunction<TrackLootViewRequest, GenericResponse>('trackLootView', req)
}

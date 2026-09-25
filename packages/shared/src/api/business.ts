// Business — onboarding, profile, branches, follow.

import { callFunction } from '../client'
import type {
  ChooseAccountTypeRequest, ChooseAccountTypeResponse,
  OnboardBusinessRequest, OnboardBusinessResponse,
  UpdateBusinessRequest, UpdateBusinessResponse,
  AddBranchRequest, AddBranchResponse,
  RemoveBranchRequest,
  SubmitVerificationRequest, SubmitVerificationResponse,
  FollowBusinessRequest, UnfollowBusinessRequest,
  GetBusinessRequest, GetBusinessResponse,
  GetBusinessLootRequest, GetBusinessLootResponse,
  GenericResponse,
} from '../types'

export function chooseAccountType(req: ChooseAccountTypeRequest) {
  return callFunction<ChooseAccountTypeRequest, ChooseAccountTypeResponse>('chooseAccountType', req)
}

export function onboardBusiness(req: OnboardBusinessRequest) {
  return callFunction<OnboardBusinessRequest, OnboardBusinessResponse>('onboardBusiness', req)
}

export function updateBusiness(req: UpdateBusinessRequest) {
  return callFunction<UpdateBusinessRequest, UpdateBusinessResponse>('updateBusiness', req)
}

export function addBranch(req: AddBranchRequest) {
  return callFunction<AddBranchRequest, AddBranchResponse>('addBranch', req)
}

export function removeBranch(req: RemoveBranchRequest) {
  return callFunction<RemoveBranchRequest, GenericResponse>('removeBranch', req)
}

export function submitVerification(req: SubmitVerificationRequest) {
  return callFunction<SubmitVerificationRequest, SubmitVerificationResponse>('submitVerification', req)
}

export function followBusiness(req: FollowBusinessRequest) {
  return callFunction<FollowBusinessRequest, GenericResponse>('followBusiness', req)
}

export function unfollowBusiness(req: UnfollowBusinessRequest) {
  return callFunction<UnfollowBusinessRequest, GenericResponse>('unfollowBusiness', req)
}

export function getBusiness(req: GetBusinessRequest) {
  return callFunction<GetBusinessRequest, GetBusinessResponse>('getBusiness', req)
}

export function getBusinessLoot(req: GetBusinessLootRequest) {
  return callFunction<GetBusinessLootRequest, GetBusinessLootResponse>('getBusinessLoot', req)
}

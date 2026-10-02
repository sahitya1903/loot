// Business — onboarding, profile, branches, follow.

import { callFunction } from '../client.js'

export function chooseAccountType(req) {
  return callFunction('chooseAccountType', req)
}

export function onboardBusiness(req) {
  return callFunction('onboardBusiness', req)
}

export function updateBusiness(req) {
  return callFunction('updateBusiness', req)
}

export function addBranch(req) {
  return callFunction('addBranch', req)
}

export function removeBranch(req) {
  return callFunction('removeBranch', req)
}

export function submitVerification(req) {
  return callFunction('submitVerification', req)
}

export function followBusiness(req) {
  return callFunction('followBusiness', req)
}

export function unfollowBusiness(req) {
  return callFunction('unfollowBusiness', req)
}

export function getBusiness(req) {
  return callFunction('getBusiness', req)
}

export function getBusinessLoot(req) {
  return callFunction('getBusinessLoot', req)
}

// Pro subscription API client.

import { callFunction } from '../client.js'

export function getProSubscriptionPlans() {
  return callFunction('getProSubscriptionPlans', {})
}

export function createProSubscription(planId) {
  return callFunction('createProSubscription', { planId })
}

export function cancelProSubscription() {
  return callFunction('cancelProSubscription', {})
}

export function getProSubscriptionStatus() {
  return callFunction('getProSubscriptionStatus', {})
}

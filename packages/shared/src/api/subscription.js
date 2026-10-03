// Pro subscription — professional accounts.

import { apiRequest } from '../client.js'

export function getProSubscriptionPlans() {
  return apiRequest('GET', '/v1/subscriptions/plans')
}

/** @returns {Promise<{ subscriptionId: string, razorpayKey: string }>} */
export function createProSubscription(planId) {
  return apiRequest('POST', '/v1/subscriptions', { body: { planId } })
}

export function cancelProSubscription() {
  return apiRequest('DELETE', '/v1/subscriptions/current')
}

export function getProSubscriptionStatus() {
  return apiRequest('GET', '/v1/subscriptions/current')
}

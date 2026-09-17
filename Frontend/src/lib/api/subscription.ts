// Pro subscription API client.

import { callFunction } from '@/lib/firebase/functions'
import type { ProSubscriptionPlan, ProSubscription } from '@/types'

interface PlansResponse {
  success: boolean
  plans?: ProSubscriptionPlan[]
  errorMessage?: string
}

interface CreateSubscriptionResponse {
  success: boolean
  subscriptionId?: string
  razorpayKey?: string
  errorMessage?: string
}

interface StatusResponse {
  success: boolean
  subscription?: ProSubscription | null
  errorMessage?: string
}

export function getProSubscriptionPlans() {
  return callFunction<Record<string, never>, PlansResponse>('getProSubscriptionPlans', {})
}

export function createProSubscription(planId: string) {
  return callFunction<{ planId: string }, CreateSubscriptionResponse>('createProSubscription', { planId })
}

export function cancelProSubscription() {
  return callFunction<Record<string, never>, { success: boolean }>('cancelProSubscription', {})
}

export function getProSubscriptionStatus() {
  return callFunction<Record<string, never>, StatusResponse>('getProSubscriptionStatus', {})
}

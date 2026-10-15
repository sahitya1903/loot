import { ApiError } from '@loot/shared';

// Friendlier copy for the API's stable error codes. Anything else falls back to the
// API's own message, then to a generic network message.
const MESSAGES = {
  otp_invalid:
    'That code is wrong or has expired. Check the latest one or request a new one.',
  otp_attempts_exceeded: 'Too many wrong codes. Request a new one.',
  otp_delivery_failed: 'We couldn’t send the code. Try again in a moment.',
  rate_limited: 'Too many attempts. Wait a few minutes and try again.',
  loot_sold_out: 'Sold out. Someone got the last one.',
  loot_expired: 'This loot has expired.',
  loot_not_claimable: 'This loot is no longer available.',
  loot_not_found: 'This loot is no longer available.',
  redemption_not_found: 'No claim with that code at your business.',
  redemption_already_used: 'This code has already been redeemed.',
  redemption_expired: 'This code has expired.',
  username_taken: 'That username is taken.',
  business_exists: 'This account already has a business.',
  business_profile_required: 'Set up your business first.',
  account_type_required: 'Your account type can’t do that.',
};

/** A short, human message for any error thrown by @loot/shared or fetch. */
export function errorMessage(error) {
  if (error instanceof ApiError) {
    if (error.code === 'validation_failed' && error.details?.length)
      return error.details[0].message;
    return MESSAGES[error.code] ?? error.message;
  }
  return 'Can’t reach Loot. Check your connection and try again.';
}

/** Field → message map from a validation_failed error, for inline form errors. */
export function fieldErrors(error) {
  if (!(error instanceof ApiError) || error.code !== 'validation_failed')
    return {};
  return Object.fromEntries(
    (error.details ?? []).map((d) => [d.path, d.message]),
  );
}

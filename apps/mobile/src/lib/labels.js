// Display labels for API enum values.

const CATEGORY_LABELS = {
  food_drink: 'Food & drink',
  nightlife: 'Nightlife',
  retail: 'Retail',
  wellness: 'Wellness',
  entertainment: 'Entertainment',
  services: 'Services',
  experiences: 'Experiences',
  flash_commerce: 'Flash sales',
  creator: 'Creators',
  other: 'Other',
  cafe: 'Café',
  restaurant: 'Restaurant',
  bar_club: 'Bar or club',
  retail_store: 'Retail store',
  salon_spa: 'Salon or spa',
  gym_studio: 'Gym or studio',
  venue: 'Venue',
  service_provider: 'Services',
};

/** Loot and business categories share one label table. */
export function categoryLabel(value) {
  return CATEGORY_LABELS[value] ?? value;
}

const STATUS_LABELS = {
  draft: 'Draft',
  active: 'Live',
  trending: 'Trending',
  expiring: 'Ending soon',
  expired: 'Expired',
  archived: 'Archived',
};

export function statusLabel(value) {
  return STATUS_LABELS[value] ?? value;
}

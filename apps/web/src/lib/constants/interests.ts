export const INTERESTS = [
    // Creative
    'Photography', 'Art', 'Design', 'Music', 'Dance', 'Writing', 'Filmmaking', 'Podcasting',
    // Tech & Business
    'Technology', 'Startups', 'Entrepreneurship', 'Investing', 'Marketing', 'Product Management',
    // Lifestyle
    'Travel', 'Food & Dining', 'Cooking', 'Fashion', 'Fitness', 'Yoga', 'Meditation', 'Hiking',
    // Social & Learning
    'Networking', 'Reading', 'Gaming', 'Movies', 'Volunteering', 'Education', 'Public Speaking',
    // Sports & Outdoors
    'Sports', 'Running', 'Cycling', 'Swimming', 'Climbing',
    // Other
    'Sustainability', 'Mental Health', 'Spirituality', 'Parenting', 'Pets',
] as const;

export type Interest = (typeof INTERESTS)[number];

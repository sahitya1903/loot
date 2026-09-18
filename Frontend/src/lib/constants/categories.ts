export const PROFESSIONAL_CATEGORIES = [
    { value: 'photographer', label: 'Photographer' },
    { value: 'videographer', label: 'Videographer' },
    { value: 'dj', label: 'DJ' },
    { value: 'makeup_artist', label: 'Makeup Artist' },
    { value: 'mehndi_artist', label: 'Mehndi Artist' },
    { value: 'decorator', label: 'Decorator' },
    { value: 'caterer', label: 'Caterer' },
    { value: 'venue', label: 'Venue' },
    { value: 'wedding_planner', label: 'Wedding Planner' },
    { value: 'event_planner', label: 'Event Planner' },
    { value: 'florist', label: 'Florist' },
    { value: 'choreographer', label: 'Choreographer' },
    { value: 'anchor_emcee', label: 'Anchor / Emcee' },
    { value: 'band_musician', label: 'Band / Musician' },
    { value: 'sound_lighting', label: 'Sound & Lighting' },
    { value: 'invitation_designer', label: 'Invitation Designer' },
    { value: 'baker_cake_artist', label: 'Baker / Cake Artist' },
] as const;

export type ProfessionalCategory = (typeof PROFESSIONAL_CATEGORIES)[number]['value'];

/**
 * Maps lowercase search terms (including plurals, synonyms) to category values.
 */
export const CATEGORY_SEARCH_TERMS: Record<string, ProfessionalCategory> = {
    // Photographer
    'photographer': 'photographer',
    'photographers': 'photographer',
    'photography': 'photographer',
    'photo': 'photographer',
    // Videographer
    'videographer': 'videographer',
    'videographers': 'videographer',
    'videography': 'videographer',
    'video': 'videographer',
    'cinematographer': 'videographer',
    'cinematography': 'videographer',
    // DJ
    'dj': 'dj',
    'djs': 'dj',
    'disc jockey': 'dj',
    // Makeup Artist
    'makeup artist': 'makeup_artist',
    'makeup artists': 'makeup_artist',
    'makeup': 'makeup_artist',
    'mua': 'makeup_artist',
    'make up': 'makeup_artist',
    'make up artist': 'makeup_artist',
    // Mehndi Artist
    'mehndi artist': 'mehndi_artist',
    'mehndi artists': 'mehndi_artist',
    'mehndi': 'mehndi_artist',
    'henna': 'mehndi_artist',
    'henna artist': 'mehndi_artist',
    // Decorator
    'decorator': 'decorator',
    'decorators': 'decorator',
    'decoration': 'decorator',
    'decorations': 'decorator',
    'decor': 'decorator',
    // Caterer
    'caterer': 'caterer',
    'caterers': 'caterer',
    'catering': 'caterer',
    // Venue
    'venue': 'venue',
    'venues': 'venue',
    'banquet': 'venue',
    'banquet hall': 'venue',
    'hall': 'venue',
    // Wedding Planner
    'wedding planner': 'wedding_planner',
    'wedding planners': 'wedding_planner',
    'wedding planning': 'wedding_planner',
    // Event Planner
    'event planner': 'event_planner',
    'event planners': 'event_planner',
    'event planning': 'event_planner',
    'event manager': 'event_planner',
    'event management': 'event_planner',
    // Florist
    'florist': 'florist',
    'florists': 'florist',
    'flower': 'florist',
    'flowers': 'florist',
    'floral': 'florist',
    // Choreographer
    'choreographer': 'choreographer',
    'choreographers': 'choreographer',
    'choreography': 'choreographer',
    'dance': 'choreographer',
    // Anchor / Emcee
    'anchor': 'anchor_emcee',
    'anchors': 'anchor_emcee',
    'emcee': 'anchor_emcee',
    'emcees': 'anchor_emcee',
    'mc': 'anchor_emcee',
    'host': 'anchor_emcee',
    // Band / Musician
    'band': 'band_musician',
    'bands': 'band_musician',
    'musician': 'band_musician',
    'musicians': 'band_musician',
    'music': 'band_musician',
    'singer': 'band_musician',
    'singers': 'band_musician',
    // Sound & Lighting
    'sound': 'sound_lighting',
    'lighting': 'sound_lighting',
    'sound and lighting': 'sound_lighting',
    'sound & lighting': 'sound_lighting',
    'lights': 'sound_lighting',
    // Invitation Designer
    'invitation designer': 'invitation_designer',
    'invitation designers': 'invitation_designer',
    'invitation': 'invitation_designer',
    'invitations': 'invitation_designer',
    'invite designer': 'invitation_designer',
    'card designer': 'invitation_designer',
    // Baker / Cake Artist
    'baker': 'baker_cake_artist',
    'bakers': 'baker_cake_artist',
    'cake artist': 'baker_cake_artist',
    'cake artists': 'baker_cake_artist',
    'cake': 'baker_cake_artist',
    'cakes': 'baker_cake_artist',
    'bakery': 'baker_cake_artist',
};

/**
 * Attempts to match a search query to a professional category.
 * Strips "near me" and tries to match the remaining query against known terms.
 * Returns the category value or null if no match.
 */
export function matchCategoryFromQuery(query: string): ProfessionalCategory | null {
    const cleaned = query.toLowerCase().replace(/\s*near\s*me\s*/gi, '').trim();
    if (!cleaned) return null;

    // Direct match
    if (CATEGORY_SEARCH_TERMS[cleaned]) {
        return CATEGORY_SEARCH_TERMS[cleaned];
    }

    // Check if any multi-word search term is contained in the query
    for (const [term, category] of Object.entries(CATEGORY_SEARCH_TERMS)) {
        if (term.length > 3 && cleaned.includes(term)) {
            return category;
        }
    }

    return null;
}

/**
 * Maps a stored category value back to its display label.
 */
export function getCategoryLabel(value: string): string {
    const found = PROFESSIONAL_CATEGORIES.find(c => c.value === value);
    return found?.label ?? value;
}

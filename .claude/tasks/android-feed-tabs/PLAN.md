# Android feed tabs

Give the Android app the Trending and Following feeds the API already serves, and a way to follow
a business so Following has something in it.

## Design
- The Nearby tab becomes the feed screen with a switch at the top: **Nearby · Trending · Following**.
  Business accounts follow no one (the API forbids it), so they see Nearby · Trending only.
- All three share the location row and category chips. Trending uses the area and radius;
  Following ignores the radius (it's "wherever they are") but sends coordinates for distance.
- Nearby keeps its live "new loot nearby" pill; Trending and Following watch their cards' counters.
- Follow button on the loot screen (hunters only), next to the business name. It reads
  `isFollowing` from `GET /v1/businesses/:id` and refreshes the Following feed after a change.
- Query keys: `queryKeys.feed.trending` and `.following` grow the params they depend on
  (area, radius, category) so switching filters refetches. The web hook updates to match.

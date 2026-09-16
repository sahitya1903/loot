# Graph Report - .  (2026-04-27)

## Corpus Check
- 1 files · ~5,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 226 nodes · 296 edges · 21 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Mobile App & Web Frontend|Mobile App & Web Frontend]]
- [[_COMMUNITY_Local Dev Functions|Local Dev Functions]]
- [[_COMMUNITY_App Store Connect Integration|App Store Connect Integration]]
- [[_COMMUNITY_Affiliate Reports|Affiliate Reports]]
- [[_COMMUNITY_Thumbnail Generation|Thumbnail Generation]]
- [[_COMMUNITY_Face Detection (Python)|Face Detection (Python)]]
- [[_COMMUNITY_Whitelist & Participant Checks|Whitelist & Participant Checks]]
- [[_COMMUNITY_Face Embeddings & Qdrant|Face Embeddings & Qdrant]]
- [[_COMMUNITY_Razorpay Subscriptions|Razorpay Subscriptions]]
- [[_COMMUNITY_Email Invites & Retry|Email Invites & Retry]]
- [[_COMMUNITY_Feed Fanout|Feed Fanout]]
- [[_COMMUNITY_Nearby Events Geo Search|Nearby Events Geo Search]]
- [[_COMMUNITY_RBAC Roles & Permissions|RBAC Roles & Permissions]]
- [[_COMMUNITY_Backend Module Index|Backend Module Index]]
- [[_COMMUNITY_Cloud Function Patterns|Cloud Function Patterns]]
- [[_COMMUNITY_FCM Notifications|FCM Notifications]]
- [[_COMMUNITY_WhatsApp OTP Login|WhatsApp OTP Login]]
- [[_COMMUNITY_Razorpay Payments|Razorpay Payments]]
- [[_COMMUNITY_Profile Module|Profile Module]]
- [[_COMMUNITY_Network Module|Network Module]]
- [[_COMMUNITY_Safe Deletes Module|Safe Deletes Module]]

## God Nodes (most connected - your core abstractions)
1. `main()` - 18 edges
2. `Firebase Backend Repo` - 12 edges
3. `generateEventThumbnails()` - 11 edges
4. `runAscCommand()` - 10 edges
5. `ascFetch()` - 10 edges
6. `Momento Flutter App` - 10 edges
7. `momento-web Next.js Frontend` - 9 edges
8. `Momento Platform` - 7 edges
9. `analyzeEventFaces()` - 6 edges
10. `createAppStoreVersion()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `runAscCommand()` --calls--> `generateJWT()`  [INFERRED]
  functions/local.js → functions/appstore_submit.js
- `runAscCommand()` --calls--> `findApp()`  [INFERRED]
  functions/local.js → functions/appstore_submit.js
- `runAscCommand()` --calls--> `findBuild()`  [INFERRED]
  functions/local.js → functions/appstore_submit.js
- `runAscCommand()` --calls--> `findAppStoreVersion()`  [INFERRED]
  functions/local.js → functions/appstore_submit.js
- `runAscCommand()` --calls--> `createAppStoreVersion()`  [INFERRED]
  functions/local.js → functions/appstore_submit.js

## Hyperedges (group relationships)
- **Three-repo Momento workspace** — claude_firebase_backend, claude_momento_flutter_app, claude_momento_web [EXTRACTED 1.00]
- **Cloud Function pattern triad** — claude_callable_pattern, claude_firestore_trigger_pattern, claude_scheduled_pattern [EXTRACTED 1.00]
- **Media upload + processing pipeline** — claude_mobile_upload_flow, claude_s3_storage, claude_insightface_service, claude_rekognition [EXTRACTED 1.00]

## Communities

### Community 0 - "Mobile App & Web Frontend"
Cohesion: 0.07
Nodes (38): Airbridge SDK Deep Linking, background_downloader, callFunction() wrapper, CloudFront CDN, data_classes.dart, event_details/ feature, FCM Multidevice Notifications, Firebase Auth (+30 more)

### Community 1 - "Local Dev Functions"
Cohesion: 0.12
Nodes (34): analyzeEventFaces(), backfillNeon(), calculateEventStorage(), checkWhatsappTemplates(), cleanupTempFiles(), convertHeicToJpeg(), countFacesForMedia(), countTotalGalleryFaces() (+26 more)

### Community 2 - "App Store Connect Integration"
Cohesion: 0.33
Nodes (14): ascFetch(), base64url(), cancelReviewSubmission(), createAppStoreVersion(), derToRaw(), findApp(), findAppStoreVersion(), findBuild() (+6 more)

### Community 3 - "Affiliate Reports"
Cohesion: 0.26
Nodes (9): computeStatistics(), downloadImage(), fetchAffiliateEventsInDateRange(), fetchUserEventsInDateRange(), formatDate(), formatDateTime(), generatePDF(), getEventParticipants() (+1 more)

### Community 4 - "Thumbnail Generation"
Cohesion: 0.24
Nodes (5): convertHeicToJpeg(), downloadImage(), generateCloudFrontUrl(), generateThumbnail(), isHeicImage()

### Community 5 - "Face Detection (Python)"
Cohesion: 0.25
Nodes (10): decode_image(), detect_faces(), generate_cloudfront_signed_url(), is_heic_image(), is_valid_image_key(), Check if S3 key is a HEIC/HEIF image., Decode image bytes to OpenCV format (BGR numpy array).     Handles HEIC/HEIF con, HTTP endpoint for face detection.     GET: Health check     POST: Face detection (+2 more)

### Community 6 - "Whitelist & Participant Checks"
Cohesion: 0.29
Nodes (7): getUserFcmTokens(), isParticipant(), isUserWhitelisted(), matchesWhitelist(), sendToUserDevices(), sendUploadNotification(), toggleMediaLikeCore()

### Community 7 - "Face Embeddings & Qdrant"
Cohesion: 0.29
Nodes (5): callInsightFace(), createQdrantClient(), getGlobalProfileEmbedding(), isUserFaceInEventGallery(), upsertFaceEmbedding()

### Community 8 - "Razorpay Subscriptions"
Cohesion: 0.33
Nodes (5): gbToBytes(), getRazorpayInstance(), handleSubscriptionActivated(), handleSubscriptionCharged(), handleSubscriptionExpired()

### Community 9 - "Email Invites & Retry"
Cohesion: 0.39
Nodes (6): buildInviteEmailHtml(), escapeHtml(), isRetryableError(), retryWithBackoff(), sendEmailInvite(), sleep()

### Community 10 - "Feed Fanout"
Cohesion: 0.43
Nodes (3): fanOutEventToFollowers(), getEventAuthors(), handleNewCollaborator()

### Community 11 - "Nearby Events Geo Search"
Cohesion: 0.47
Nodes (3): extractCoords(), isMirrorable(), upsertEvent()

### Community 12 - "RBAC Roles & Permissions"
Cohesion: 0.47
Nodes (3): getRoleSettings(), getUserRole(), hasPermission()

### Community 13 - "Backend Module Index"
Cohesion: 0.33
Nodes (6): event.js, feed.js, firestore.rules, index.js, RBAC Roles & Permissions, roles.js

### Community 14 - "Cloud Function Patterns"
Cohesion: 0.33
Nodes (6): asia-south1 Cloud Functions Region, onCall Callable Function Pattern, Firestore Trigger Pattern, options.js, Rationale: options.js imported first sets global region, Scheduled onSchedule Pattern

### Community 15 - "FCM Notifications"
Cohesion: 0.5
Nodes (2): getUserFcmTokens(), sendToUserDevices()

### Community 23 - "WhatsApp OTP Login"
Cohesion: 1.0
Nodes (2): login.js, WhatsApp Cloud API

### Community 24 - "Razorpay Payments"
Cohesion: 1.0
Nodes (2): razorpay.js, Razorpay Payments

### Community 34 - "Profile Module"
Cohesion: 1.0
Nodes (1): profile.js

### Community 35 - "Network Module"
Cohesion: 1.0
Nodes (1): network.js

### Community 36 - "Safe Deletes Module"
Cohesion: 1.0
Nodes (1): safeDeletes.js

## Knowledge Gaps
- **40 isolated node(s):** `Generate a CloudFront signed URL for the given S3 key.          Args:         s3`, `Check if S3 key ends with a valid image extension.`, `Check if S3 key is a HEIC/HEIF image.`, `Decode image bytes to OpenCV format (BGR numpy array).     Handles HEIC/HEIF con`, `HTTP endpoint for face detection.     GET: Health check     POST: Face detection` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `FCM Notifications`** (5 nodes): `notifications.js`, `getUserFcmTokens()`, `recordPhotoMatchNotification()`, `sendFeedEventNotifications()`, `sendToUserDevices()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WhatsApp OTP Login`** (2 nodes): `login.js`, `WhatsApp Cloud API`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Razorpay Payments`** (2 nodes): `razorpay.js`, `Razorpay Payments`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Profile Module`** (1 nodes): `profile.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Network Module`** (1 nodes): `network.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Safe Deletes Module`** (1 nodes): `safeDeletes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `runAscCommand()` connect `App Store Connect Integration` to `Local Dev Functions`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Firebase Backend Repo` connect `Mobile App & Web Frontend` to `Cloud Function Patterns`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `runAscCommand()` (e.g. with `generateJWT()` and `findApp()`) actually correct?**
  _`runAscCommand()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Generate a CloudFront signed URL for the given S3 key.          Args:         s3`, `Check if S3 key ends with a valid image extension.`, `Check if S3 key is a HEIC/HEIF image.` to the rest of the system?**
  _40 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Mobile App & Web Frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Local Dev Functions` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
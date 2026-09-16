# Momento Firebase Functions — AI Coding Guidelines

## Architecture Overview
Node.js 22 Cloud Functions backend for Momento app. Uses Firebase v2 callable functions with **ES modules** (`"type": "module"` in package.json). All functions deploy to **asia-south1** region.

### External Services
- **AWS S3** — Media storage (profile pictures, event galleries, cover photos)
- **AWS Rekognition** — Face detection and liveness verification
- **Google Play/Apple Store** — Subscription verification
- **WhatsApp OTP** — Login authentication

## File Organization
```
functions/
├── index.js         # Main exports, geocoding, S3 operations
├── event.js         # Event CRUD, gallery, join flow, permissions
├── profile.js       # User profile, username, professional accounts
├── login.js         # WhatsApp OTP authentication
├── notifications.js # FCM push notifications, Firestore triggers
├── subscription.js  # In-app purchase verification
├── rekognition.js   # Face detection, liveness checks
├── roles.js         # RBAC constants and permission helpers
└── safeDeletes.js   # Cascade deletion triggers
```

## Function Pattern
All callable functions follow this structure:
```javascript
import {onCall} from "firebase-functions/v2/https";
import {error as _error, warn, info} from "firebase-functions/logger";

export const functionName = onCall({
  secrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],  // as needed
  region: "asia-south1",  // ALWAYS asia-south1
}, async (request) => {
  // Auth check
  if (!request.auth?.uid) {
    throw new Error("unauthenticated");
  }
  // Implementation...
});
```

## Role-Based Access Control (roles.js)
```javascript
import {ROLES, PERMISSIONS, hasPermission} from "./roles.js";
// Roles: ROLES.CREATOR, ROLES.ADMIN, ROLES.PARTICIPANT
// Check: await hasPermission(eventId, userId, PERMISSIONS.CAN_UPLOAD_MEDIA)
```

## Firestore Triggers
Use v2 syntax for document triggers:
```javascript
import {onDocumentCreated, onDocumentDeleted} from "firebase-functions/v2/firestore";

export const onEventDeleted = onDocumentDeleted({
  document: "events/{eventId}",
  region: "asia-south1",
}, async (event) => { ... });
```

## Secrets & Environment Variables
```javascript
import {defineString, defineSecret} from "firebase-functions/params";

const S3_BUCKET = defineString("S3_BUCKET");
const AWS_SECRET_ACCESS_KEY = defineSecret("AWS_SECRET_ACCESS_KEY");

// Use in function: S3_BUCKET.value(), AWS_SECRET_ACCESS_KEY.value()
```

## Development Commands
```bash
npm run serve      # Start emulators locally
npm run deploy     # Deploy to Firebase
npm run logs       # View function logs
npm run lint       # ESLint check
```

## Key Patterns
- **Presigned URLs** — S3 uploads return presigned URLs to client (see `getGalleryMediaUploadUrl`)
- **Participant checks** — Always verify user is participant before allowing event operations
- **Production check** — `const production = projectId === "momento-b7d02"` for environment-specific logic

## Error Handling
Use Firebase logger and throw descriptive errors:
```javascript
import {error as _error, warn, info} from "firebase-functions/logger";

_error("Descriptive message", {contextData});
throw new Error("error-code: Human readable message");
```

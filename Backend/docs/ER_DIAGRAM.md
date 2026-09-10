# Momento Database — ER Diagram

Source: [ARCHITECTURE.md](ARCHITECTURE.md#L252-L293) Firestore schema.

```mermaid
erDiagram
    USERS ||--o{ FOLLOWERS : "has"
    USERS ||--o{ FOLLOWING : "has"
    USERS ||--o{ NETWORK : "connected via"
    USERS ||--|| STORAGE : "tracks"
    USERS ||--|| ACCOUNT_PREFS : "configures"
    USERS ||--o{ SUBSCRIPTIONS : "owns"
    USERS ||--o{ EVENTS : "creates"
    USERS ||--o{ PARTICIPANTS : "joins"
    USERS ||--o{ GALLERY : "uploads"
    USERS ||--o{ CHATS : "participates"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ OTP : "requests"

    EVENTS ||--o{ PARTICIPANTS : "has"
    EVENTS ||--o{ GALLERY : "contains"
    EVENTS ||--|| EVENT_PREFS : "configured by"
    EVENTS ||--o{ EVENT_CHAT : "has"

    CHATS ||--o{ MESSAGES : "contains"
    EVENT_CHAT ||--o{ MESSAGES : "contains"

    USERS {
        string userId PK
        string name
        string username UK
        string profilePicture
        string about
        int followersCount
        int followingCount
        int eventsCount
        timestamp createdAt
        timestamp updatedAt
    }

    FOLLOWERS {
        string followerId PK,FK
        timestamp followedAt
    }

    FOLLOWING {
        string followingId PK,FK
        timestamp followedAt
    }

    NETWORK {
        string otherUserId PK,FK
        timestamp connectedAt
        array sharedEvents
    }

    STORAGE {
        int totalBytesUsed
        string plan
        int limit
        timestamp updatedAt
    }

    ACCOUNT_PREFS {
        array fcmTokens
        string fcmToken "legacy"
        object notifications
        string theme
        string language
    }

    SUBSCRIPTIONS {
        string subscriptionId PK
        string planId
        string status
        timestamp expiresAt
    }

    EVENTS {
        string eventId PK
        string name
        string description
        array coverPhotos
        timestamp startDateTime
        timestamp endDateTime
        object address
        string createdBy FK
        string inviteKey
        bool isPublic
        string whoCanJoin
        bool requireApproval
    }

    PARTICIPANTS {
        string userId PK,FK
        string role
        timestamp joinedAt
        bool isACollaborator
    }

    GALLERY {
        string mediaId PK
        string s3Key
        string thumbnailS3Key
        string mimeType
        int size
        timestamp timestamp
        string uploadedBy FK
        int likesCount
        array likedBy
        array people
        array embeddings
    }

    EVENT_PREFS {
        object roleSettings "Creator/Admin/Participant"
    }

    EVENT_CHAT {
        string chatId PK
    }

    CHATS {
        string chatId PK
        string type "1-to-1 | group"
        timestamp createdAt
        array participants
        string status "active|pending|rejected"
    }

    MESSAGES {
        string messageId PK
        string text
        string senderId FK
        timestamp timestamp
        array visibleTo
    }

    OTP {
        string phoneNumber PK
        string otp
        timestamp createdAt "10-min TTL"
    }
```

## Notes

- Firestore is document-based; "FK" relationships are by document ID convention, not enforced.
- Subcollections under `users/{userId}`: `followers`, `following`, `network`, `storage`, `accountPreferences`, `subscriptions`.
- Subcollections under `events/{eventId}`: `participants`, `gallery`, `chat`, `eventPreferences`.
- Face embeddings on gallery media are mirrored to Qdrant (external vector DB), not Firestore.
- `network` is bidirectional — auto-created via `onParticipantJoinedNetwork` trigger when users share an event.

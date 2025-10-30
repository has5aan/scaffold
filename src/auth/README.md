# Auth Module

The auth module handles user authentication and authorization using GoTrue (Supabase Auth).

## Domain Overview

The auth module is the foundational domain that manages:

- **User Authentication**: Token-based authentication via GoTrue
- **User Domain Models**: Immutable user objects with GoTrue integration
- **Auth Service**: Core authentication business logic using GoTrue client
- **Database Models**: User data access and relationships

## Structure

```
src/auth/
├── domain/             # Domain models
│   └── user.domain.js
├── models/             # Database model definitions
│   └── user.model.js
├── services/           # Authentication business logic
│   └── auth.service.js
├── migrations/         # Database migrations for auth schema
│   ├── auth-01-schema.js
│   └── auth-02-user.js
└── README.md
```

**Note:** Authentication middleware is located in `src/platforms/express/middleware/auth.middleware.js` as it is Express-specific. The auth service provides transport-agnostic authentication logic.

## User Domain Model

The `User` domain model wraps GoTrue's user object with:

- Immutable properties
- Frozen metadata
- Helper methods (`isEmailConfirmed()`, `isAuthenticated()`)
- JSON serialization

## Authentication Flow

The authentication flow is transport-independent, with platform-specific adapters handling HTTP details:

1. **Platform Adapter** extracts Bearer token from transport-specific request (Authorization header)
2. **Platform Adapter** calls `authenticateToken()` from auth service
3. **Auth Service** validates token with GoTrue client
4. **User Domain Model** is created from validated GoTrue user data
5. **Platform Adapter** attaches user to transport-specific context (request object, context, etc.)

**Example Platform Implementations:**

- **Express**: `src/platforms/express/middleware/auth.middleware.js`
- **Future**: Vercel, Deno, Lambda, etc.

## Database Schema

The auth schema contains:

- `users` table: Simplified user table for testing (based on GoTrue's schema structure)

**Note:** In production, GoTrue manages its own `auth.users` table. Our simplified table is for development/testing purposes only.

## Future Enhancements

- Role-based access control (RBAC)
- Multi-factor authentication (MFA) support
- Session management

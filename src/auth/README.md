# Auth Module

The auth module handles user authentication and authorization using GoTrue (Supabase Auth).

## Domain Overview

The auth module is the foundational domain that manages:

- **User Authentication**: Token-based authentication via GoTrue
- **User Domain Models**: Immutable user objects with GoTrue integration
- **Transport-Agnostic Middleware**: Core authentication logic independent of HTTP framework
- **Framework Adapters**: Express, Vercel, and Deno authentication middleware adapters

## Structure

```
src/auth/
├── domain/             # Domain models
│   └── user.domain.js
├── middleware/         # Transport-agnostic auth logic
│   └── auth.middleware.js
├── migrations/         # Database migrations for auth schema
│   ├── 00-01-schema.js
│   └── 00-02-user.js
└── README.md

src/adapters/
└── auth.adapter.js     # Framework-specific auth middleware adapters (Express, Vercel, Deno)
```

**Note:** Auth adapters live in `src/adapters/` (not in the auth module) because they are transport-layer concerns, shared alongside other transport adapters (request, response, error).

## User Domain Model

The `User` domain model wraps GoTrue's user object with:

- Immutable properties
- Frozen metadata
- Helper methods (`isEmailConfirmed()`, `isAuthenticated()`)
- JSON serialization

## Authentication Flow

1. **Transport Layer** receives request with Bearer token
2. **Auth Adapter** extracts token and calls `authenticateToken()`
3. **Auth Middleware** validates token with GoTrue
4. **User Domain Model** is created and returned
5. **Transport Layer** attaches user to request/context

## Database Schema

The auth schema contains:

- `users` table: Simplified user table for testing (matches GoTrue's schema structure)

**Note:** In production, GoTrue manages its own `auth.users` table. Our simplified table is for development/testing purposes only.

## Future Enhancements

- Subscription management logic
- Role-based access control (RBAC)
- Multi-factor authentication (MFA) support
- Session management

# Backend Core (Stage 1)

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)

## Events

- `GET /api/events` (public, only `APPROVED`)
  - filters: `q`, `categoryId`, `districtId`, `type`, `dateFrom`, `dateTo`
- `POST /api/events` (auth required)
  - Community events default: `PENDING`
  - Official events by admin: `APPROVED`

## Metadata

- `GET /api/meta/categories`
- `GET /api/meta/districts`

## Favorites

- `GET /api/favorites` (auth)
- `POST /api/favorites` (auth)
- `DELETE /api/favorites/:eventId` (auth)

## Moderation

- `GET /api/admin/events/moderation-queue` (admin)
  - default statuses: `PENDING`, `NEEDS_EDIT`
  - optional query: `status`
- `PATCH /api/admin/events/:eventId/moderation` (admin)
  - statuses: `NEEDS_EDIT`, `APPROVED`, `REJECTED`

## Review Rule

- `GET /api/reviews/event/:eventId`
- `POST /api/reviews` (auth)
- one review per user per event is enforced in DB
- review creation is allowed only after event end and only for `APPROVED` events

## Guest Favorites

Guest favorites are supported on client via `localStorage` and synchronized to server favorites after login.

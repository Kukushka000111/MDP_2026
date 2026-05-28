# Cultural Navigator

Monorepo for the "Cultural Navigator" platform.

## Structure

- `server` - Node.js + Express + PostgreSQL backend core
- `client` - React frontend (placeholder for upcoming stages)
- `db` - SQL schema and seed scripts

## Stage 1 Scope

- Project structure (monorepo)
- Database schema for users/events/categories/favorites/reviews/moderation
- Backend core with auth and moderation-aware events API
- Frontend core with event feed, Leaflet map, and responsive filters

## Run

1. Configure backend env:
   - copy `server/.env.example` to `server/.env`
   - for admin moderation access, set `ADMIN_EMAILS` (comma-separated emails)
2. Create PostgreSQL database `cultural_navigator`
3. Run migration and seed:
   - `npm run db:migrate`
   - `npm --workspace server run db:seed`
4. Start backend:
   - `npm run dev:server`
5. Start frontend:
   - `npm run dev:client`

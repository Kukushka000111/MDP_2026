# Backend API

Базовый префикс: `/api`. Health: `GET /health` (без префикса).

## Auth

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register` | body: `email`, `password`, `displayName` |
| POST | `/auth/login` | body: `email`, `password` |
| GET | `/auth/me` | Bearer — текущий пользователь |

Сообщения об ошибках на русском (занятый email, неверный пароль).

## Events

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/events` | публично | Только `APPROVED`. Query: `q`, `categoryId`, `districtId`, `type` (`OFFICIAL` \| `COMMUNITY`), `dateFrom`, `dateTo`, `page`, `limit` (default 10). Ответ: `{ items, total, page, limit, totalPages }` |
| GET | `/events/:eventId` | optionalAuth | APPROVED всем; иначе организатор или ADMIN |
| POST | `/events` | auth | Создание; community → `PENDING` |
| PATCH | `/events/:eventId` | auth | Редактирование; community от пользователя → снова `PENDING` |
| DELETE | `/events/:eventId` | auth | Организатор или ADMIN |
| POST | `/events/:eventId/attend` | auth | Запись |
| DELETE | `/events/:eventId/attend` | auth | Отмена записи |
| GET | `/events/:eventId/participants` | auth | Организатор или ADMIN |

Тело создания/обновления (camelCase): `title`, `description`, `categoryId`, `districtId`, `address`, `latitude`, `longitude`, `imageUrl`, `organizerName`, `organizerPhone`, `organizerTelegram`, `organizerVk`, `maxParticipants` (число или `null` — без лимита), `startsAt`, `endsAt`, `eventType`.

Запись на событие: при заполненном лимите и отсутствии мест — `409` «Свободных мест нет».

Валидация адреса: город, улица, номер дома; `endsAt` ≥ `startsAt`.

## Meta

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/meta/categories` | Список категорий |
| GET | `/meta/districts` | Список районов |
| GET | `/meta/geocode?q=` | Прокси Nominatim (до 5 результатов) |

## Favorites

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/favorites` | auth |
| POST | `/favorites` | auth, body: `{ eventId }` |
| DELETE | `/favorites/:eventId` | auth |

## Reviews

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/reviews/event/:eventId` | Список отзывов |
| POST | `/reviews` | auth; один отзыв на user+event; только после `ends_at` и только если пользователь записан на событие |

## Me

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/me/profile` | Профиль (`phone`, `avatar_url`) |
| PATCH | `/me/profile` | body: `displayName`, `phone`, `avatarUrl` |
| GET | `/me/created-events` | Мои события (все статусы модерации) |
| GET | `/me/attending-events` | Куда записан |

## Admin

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/admin/stats` | Счётчики users/events/registrations/moderation |
| GET | `/admin/events/moderation-queue` | Query `status` опционально |
| PATCH | `/admin/events/:eventId/moderation` | body: `status` (`NEEDS_EDIT` \| `APPROVED` \| `REJECTED`), `moderationComment` |

## Ошибки

Ответ: `{ "error": "текст на русском" }`, HTTP-код по ситуации (400, 401, 403, 404, 409).

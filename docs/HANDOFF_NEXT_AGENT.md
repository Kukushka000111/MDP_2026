# Handoff: «Культурный Навигатор» — контекст для следующего агента

Этот файл описывает, что уже сделано в репозитории и на чём остановились. Пользователь переносит проект на другой ПК (ZIP) и может продолжать работу в другом чате/модели.

## Продукт и стек

- **Название:** «Культурный Навигатор» — веб-сервис для поиска городских мероприятий (официальные + от жителей), карта, модерация, избранное, отзывы, запись на событие.
- **Frontend:** React 18, Vite, Tailwind CSS, Leaflet / react-leaflet (`client/`).
- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT, bcryptjs, Zod (`server/`).
- **Структура:** monorepo в корне: `package.json` с `workspaces: ["server", "client"]`, папки `db/`, `docs/`, исходный отчёт `ОЧТЁТ МДП (6).docx` в корне.

## Запуск на новой машине

1. Установить **Node.js** (LTS) и **PostgreSQL**.
2. Создать БД, например `cultural_navigator`.
3. Скопировать `server/.env.example` → `server/.env` и заполнить:
   - `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/cultural_navigator`
   - `JWT_SECRET=<длинная случайная строка>`
   - `ADMIN_EMAILS=<email через запятую>` — при **регистрации** с этим email пользователь получает роль `ADMIN`.
4. В корне проекта:
   - `npm install`
   - `npm run db:migrate` — применяет `db/schema.sql`
   - `npm --workspace server run db:seed` — сиды категорий/районов из `db/seed.sql`
5. Два терминала:
   - `npm run dev:server` — обычно порт **4000**
   - `npm run dev:client` — **http://localhost:5173**
6. Клиент ходит на API по **`http://localhost:4000/api`** (см. `client/src/api.js`).

## База данных (сущности)

Файл схемы: **`db/schema.sql`**.

- `users` — роли enum `USER` | `ADMIN` (админ задаётся через `ADMIN_EMAILS` при регистрации в `server/src/routes/auth.js`).
- `categories`, `districts`
- `events` — тип `OFFICIAL` | `COMMUNITY`, модерация `PENDING` | `NEEDS_EDIT` | `APPROVED` | `REJECTED`, поля гео, `image_url` (URL или data URL base64), `created_by`, и т.д.
- `favorites` — для авторизованных.
- `reviews` — уникальность `(user_id, event_id)`; на API отзыв только после `ends_at` и только для `APPROVED`.
- `event_registrations` — запись пользователя на событие.

## Backend: основные маршруты

Базовый префикс: **`/api`**. Роуты подключаются в `server/src/app.js`.

| Область | Маршруты |
|---------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Meta | `GET /meta/categories`, `GET /meta/districts`, `GET /meta/geocode?q=` (прокси Nominatim + User-Agent) |
| Events | `GET /events` (публично, только `APPROVED`, фильтры q/categoryId/districtId/type/dateFrom/dateTo), `POST /events`, `GET /events/:eventId`, `DELETE /events/:eventId` (организатор или ADMIN), `POST/DELETE /events/:eventId/attend`, `GET /events/:eventId/participants` (организатор или ADMIN) |
| Admin | `GET /admin/events/moderation-queue`, `PATCH /admin/events/:eventId/moderation` |
| Favorites | `GET/POST /favorites`, `DELETE /favorites/:eventId` |
| Reviews | `GET /reviews/event/:eventId`, `POST /reviews` |
| Me | `GET /me/profile`, `GET /me/created-events`, `GET /me/attending-events` |

Скрипты БД: `server/package.json` — `db:migrate` / `db:seed` через `server/scripts/run-sql.js` и пути `../../db/...`.

## Frontend: поведение

Файл точки входа UI: **`client/src/App.jsx`** (один большой компонент с «страницами»).

- **Навигация:** hash-роутинг (`#feed`, `#profile`, `#event/<uuid>` и т.д.) — чтобы работала кнопка «Назад» в браузере; есть простые хлебные крошки.
- **Гость:** избранное в `localStorage`; после логина синхронизация на сервер.
- **Лента:** фильтры, карта, создание события (для залогиненных на странице ленты), геокодинг через API + выбор кандидата, клик по карте для точки, фото (URL или загрузка файла → base64).
- **Страница мероприятия:** полная карточка, карта только этого события, отзывы (с ленты отзывы убраны), запись/избранное/удаление при правах.
- **Кабинет:** аккаунт, мои мероприятия, куда записан, избранное; у админа — панель модератора отдельной «страницей».

API-обёртки: **`client/src/api.js`**.

## Решённые проблемы по ходу разработки

- Путь к `schema.sql` в `server/package.json` исправлен на `../../db/schema.sql`.
- Сборка фронта: `await` нельзя было внутри колбэка `setState` в `openReviews` — вынесли `await` наружу.
- Геокодинг из браузера ненадёжен (CORS/User-Agent) — вынесен на **`GET /api/meta/geocode`**.

## Документация в репозитории

- `README.md` — краткий запуск.
- `docs/backend-stage1.md` — может отставать от актуального списка эндпоинтов; источник правды — код `server/src/`.

## Что пользователь просил в последних итерациях (и сделано)

- Только «Выход» после входа; модерация на отдельной странице.
- Запись на мероприятие, список участников для организатора/модератора.
- Отдельные разделы кабинета.
- Удобнее координаты: выбор из списка геокодинга + клик по карте; подсказка формата адреса.
- Удаление мероприятия организатором и модератором.
- Страница мероприятия с отзывами, картой, фото; хлебные крошки и история браузера.

## Возможные следующие шаги (не обязательно делать)

- Автодополнение адреса при вводе (debounce) + подсветка кандидатов на карте.
- Разбить `App.jsx` на компоненты/роутер (react-router).
- Отдельное хранение файлов (S3/локальная папка) вместо base64 в БД.
- Проверить дублирование `image_url` в `db/schema.sql` (в схеме могли добавить колонку и в `CREATE TABLE`, и через `ALTER` — при миграции на чистой БД это безвредно, но можно почистить для читаемости).
- `npm audit` по уязвимостям dev-зависимостей.

## Файлы «в первую очередь» при продолжении

- `server/src/app.js`, `server/src/routes/*.js`, `server/src/schemas/*.js`
- `client/src/App.jsx`, `client/src/api.js`
- `db/schema.sql`, `db/seed.sql`
- `server/.env.example`

---

*Сгенерировано для передачи контекста следующему ассистенту. Дата в сессии пользователя: май 2026.*

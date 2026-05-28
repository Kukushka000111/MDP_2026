# Cultural Navigator — передача контекста следующему агенту

Этот файл описывает, что уже сделано в репозитории, как устроен проект и на чём остановились. Его можно целиком приложить к новому чату или агенту.

---

## 1. Назначение проекта

Веб-сервис **«Культурный Навигатор»** (курсовой/МДП контекст): агрегация городских мероприятий с картой (Leaflet), фильтрами, ролями пользователь/админ, премодерацией пользовательских событий, избранным, отзывами и записями на мероприятия.

Исходное ТЗ лежит в репозитории: `ОЧТЁТ МДП (6).docx` (не обязательно парсить для работы — логика уже отражена в коде).

---

## 2. Технологический стек

| Слой | Технологии |
|------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, react-leaflet + Leaflet |
| Backend | Node.js, Express 4, `pg`, `bcryptjs`, `jsonwebtoken`, `zod` |
| БД | PostgreSQL, расширение `pgcrypto` (UUID) |

Монорепозиторий npm workspaces: корневой `package.json`, пакеты `server/` и `client/`.

---

## 3. Структура каталогов (важное)

```
site_mdp/
├── package.json          # workspaces, скрипты dev:server, dev:client, db:migrate
├── README.md             # краткая инструкция запуска
├── PROJECT_HANDOFF.md    # этот файл
├── db/
│   ├── schema.sql        # полная схема БД (миграция через run-sql)
│   └── seed.sql          # категории и районы
├── server/
│   ├── .env.example      # шаблон переменных окружения
│   ├── .env              # локально (в git не коммитить — в .gitignore)
│   ├── package.json
│   ├── scripts/run-sql.js
│   └── src/
│       ├── app.js        # подключение роутов
│       ├── server.js
│       ├── config/env.js
│       ├── db/pool.js
│       ├── middleware/   # auth, validate, error-handler
│       ├── routes/       # auth, events, admin, meta, favorites, reviews, me
│       └── schemas/      # zod-схемы
└── client/
    ├── package.json
    ├── vite.config.js    # dev server порт 5173
    └── src/
        ├── App.jsx       # почти всё UI + hash-навигация
        ├── api.js        # fetch к http://localhost:4000/api
        └── main.jsx
```

---

## 4. Переменные окружения (`server/.env`)

Скопировать из `server/.env.example`:

| Переменная | Назначение |
|------------|------------|
| `PORT` | Порт API (по умолчанию 4000) |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/cultural_navigator` |
| `JWT_SECRET` | Секрет подписи JWT |
| `ADMIN_EMAILS` | Через запятую email-адреса: при **регистрации** с таким email пользователь получает роль `ADMIN` |

Клиент в `client/src/api.js` жёстко бьёт в **`http://localhost:4000/api`**. При смене хоста/порта бэкенда нужно править `API_BASE` там (или вынести в `import.meta.env` — пока не сделано).

---

## 5. База данных (сущности и правила)

Файл: `db/schema.sql`.

- **users**: `user_role` enum `USER` | `ADMIN`
- **categories**, **districts** — справочники
- **events**:
  - `event_type`: `OFFICIAL` | `COMMUNITY`
  - `moderation_status`: `PENDING` | `NEEDS_EDIT` | `APPROVED` | `REJECTED`
  - `image_url` — строка (в т.ч. может храниться data URL base64 с фронта)
  - координаты: оба NULL или оба заданы (CHECK)
- **favorites** — `(user_id, event_id)` PK
- **reviews** — уникальность `(user_id, event_id)` — один отзыв на пользователя на событие
- **event_registrations** — запись на мероприятие, PK `(user_id, event_id)`

**Бизнес-логика (реализовано в API):**

- Публичная лента (`GET /api/events`) отдаёт только **`APPROVED`** события.
- Создание события: `COMMUNITY` → обычно `PENDING`; `OFFICIAL` от **ADMIN** → сразу `APPROVED`.
- Отзыв: только для `APPROVED` и только после `ends_at` (см. `server/src/routes/reviews.js`).
- Запись на событие: только `APPROVED` (`POST .../attend`).
- Список участников: только **организатор** события или **ADMIN** (`GET .../participants`).
- Удаление события: **организатор** или **ADMIN** (`DELETE /api/events/:eventId`).

Миграция: из корня `npm run db:migrate` (внутри вызывается `server/scripts/run-sql.js` с путём к `../../db/schema.sql`). Сиды: `npm --workspace server run db:seed`.

---

## 6. Backend: маршруты API

Базовый префикс: `/api`.

| Метод | Путь | Кто | Описание |
|-------|------|-----|----------|
| GET | `/health` | — | Проверка живости |
| POST | `/auth/register` | — | Регистрация; роль ADMIN если email ∈ `ADMIN_EMAILS` |
| POST | `/auth/login` | — | Вход |
| GET | `/auth/me` | Bearer | Текущий пользователь |
| GET | `/events` | — | Публичная лента + фильтры `q`, `categoryId`, `districtId`, `type`, `dateFrom`, `dateTo` |
| GET | `/events/:eventId` | — | Детали **только** `APPROVED` (иначе 403) |
| POST | `/events` | Bearer | Создание события |
| DELETE | `/events/:eventId` | Bearer | Удаление (организатор или ADMIN) |
| POST | `/events/:eventId/attend` | Bearer | Запись |
| DELETE | `/events/:eventId/attend` | Bearer | Отмена записи |
| GET | `/events/:eventId/participants` | Bearer | Участники (организатор/ADMIN) |
| GET | `/meta/categories` | — | Список категорий |
| GET | `/meta/districts` | — | Список районов |
| GET | `/meta/geocode?q=` | — | Прокси к Nominatim (до 5 результатов), заголовок `User-Agent` |
| GET | `/favorites` | Bearer | Избранное |
| POST | `/favorites` | Bearer | Добавить |
| DELETE | `/favorites/:eventId` | Bearer | Убрать |
| GET | `/reviews/event/:eventId` | — | Отзывы |
| POST | `/reviews` | Bearer | Создать/обновить отзыв |
| GET | `/admin/events/moderation-queue` | Bearer ADMIN | Очередь модерации |
| PATCH | `/admin/events/:eventId/moderation` | Bearer ADMIN | Статус модерации |
| GET | `/me/profile` | Bearer | Профиль |
| GET | `/me/created-events` | Bearer | Мои созданные события |
| GET | `/me/attending-events` | Bearer | Куда записан |

Порядок регистрации роутов в `events.js`: сначала статичные пути (`/`, `/:id/attend`, участники), затем `GET /:eventId` и `DELETE`, затем `POST /` — чтобы не перехватывать `attend` как `eventId`.

---

## 7. Frontend: что реализовано

- Один крупный компонент **`client/src/App.jsx`** + **`client/src/api.js`**.
- **Hash-навигация** (`window.location.hash`): `#feed`, `#profile`, `#my-events`, `#attending`, `#favorites`, `#moderation`, `#event/<uuid>`. Это даёт работу кнопки «Назад» в браузере.
- Страницы/разделы: лента с картой, профиль, мои мероприятия, куда записан, избранное, панель модератора (только ADMIN), детальная страница события.
- **Гость**: избранное в `localStorage`; после логина синхронизируется на сервер.
- **Геокодинг**: не напрямую с браузера на Nominatim, а через **`GET /api/meta/geocode`** (обход CORS и корректный User-Agent). Выбор кандидата из списка; подсказка формата адреса (город, улица, дом); клик по карте для точки при создании.
- **Детальная страница события**: поля, фото (`image_url`), карта только этого события, отзывы (с ленты отзывы убраны), запись/избранное/удаление при правах.
- **Фото**: URL или загрузка файла → сохранение как **data URL** в БД (работает, но для продакшена лучше отдельное файловое хранилище).

Хлебные крошки — упрощённые строкой под навигацией.

---

## 8. Команды для запуска с нуля

1. Установить Node.js и PostgreSQL, создать БД `cultural_navigator`.
2. `server/.env` из `.env.example`, заполнить `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAILS`.
3. В корне репозитория:

```bash
npm install
npm run db:migrate
npm --workspace server run db:seed
```

4. Терминал 1: `npm run dev:server`  
5. Терминал 2: `npm run dev:client`  
6. Браузер: `http://localhost:5173`

---

## 9. Известные ограничения и заделы

- `API_BASE` захардкожен на localhost:4000.
- Картинки как base64 в `TEXT` — раздувает БД и лимиты запроса; для курсовой ок, для прод — S3/локальные файлы + URL.
- Nominatim: соблюдать [политику использования](https://operations.osmfoundation.org/policies/nominatim/) (не спамить запросами); сейчас запрос по кнопке/выбору.
- Документация API частично в `docs/backend-stage1.md` (может отставать от последних правок — источник правды код).
- `README.md` в корне описывает только ранний этап; полная картина — в этом handoff.

---

## 10. На чём остановились (последнее состояние)

Реализовано end-to-end: монорепо, схема БД с регистрациями и `image_url`, полный набор описанных API, UI с разделами, модерацией, детальной страницей события, геокодингом через бэкенд, удалением событий организатором/админом, отзывами на странице события, hash-роутингом.

**Явно не делалось в последних итерациях:** автодополнение адреса «на лету» при вводе, отдельный продакшен-деплой, Docker, e2e-тесты, правка README под финальный функционал.

---

## 11. Что передать в zip на другой ПК

- Весь исходный код **без** `node_modules` (или с ними — тяжелее; на новом ПК достаточно `npm install`).
- Файл **`server/.env` не класть в публичный архив** — только `.env.example`; на новом месте создать `.env` вручную.
- Приложить **`PROJECT_HANDOFF.md`** (этот файл) — следующему агенту достаточно его + доступа к репозиторию.

---

*Сгенерировано для передачи контекста между сессиями агента. Дата по контексту пользователя: май 2026.*

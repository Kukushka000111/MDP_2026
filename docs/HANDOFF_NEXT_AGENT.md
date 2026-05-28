# Handoff: «Культурный Навигатор» — полный контекст для следующего агента

**Прикрепите этот файл целиком в новый чат.** Здесь — актуальное состояние репозитория, история правок, баги, расхождения с отчётом `ОЧТЁТ МДП (6).docx` и приоритеты продолжения.

Дополнительно: `PROJECT_HANDOFF.md` (общий обзор), `docs/backend-stage1.md` (API, может отставать — **источник правды — код**).

---

## 1. Продукт

**«Культурный Навигатор»** — веб-сервис агрегации городских мероприятий (курсовой МДП, КГУ).

- Официальные события (`OFFICIAL`) и от жителей (`COMMUNITY`)
- Премодерация community-событий
- Лента + карта (Leaflet), фильтры, пагинация
- Избранное, отзывы, **запись на мероприятие** (аналог «брони»)
- Роли: гость, пользователь, администратор

Исходное ТЗ/отчёт: `ОЧТЁТ МДП (6).docx` в корне (там описан «идеальный» UI; код проще, но ядро закрыто).

---

## 2. Стек и структура

| Слой | Технологии |
|------|------------|
| Frontend | React 18, Vite 5, Tailwind 3, react-leaflet, Leaflet |
| Backend | Node.js, Express 4, `pg`, `bcryptjs`, `jsonwebtoken`, `zod` |
| БД | PostgreSQL + `pgcrypto` (UUID) |

Monorepo: корневой `package.json`, workspaces `server/`, `client/`.

```
site_mdp/
├── db/schema.sql, db/seed.sql
├── server/src/
│   ├── app.js              # express.json limit 8mb, CORS
│   ├── routes/             # auth, events, admin, meta, favorites, reviews, me
│   ├── schemas/            # zod
│   └── middleware/         # auth (requireAuth, optionalAuth), validate, error-handler
├── client/src/
│   ├── App.jsx             # оркестратор: state, hash-роутинг, handlers (~650 строк)
│   ├── api.js              # все fetch; API_BASE из VITE_API_URL или localhost:4000
│   ├── constants.js        # PAGES, PAGE_SIZE=10, TOKEN_KEY, FAVORITES_KEY
│   ├── utils.js            # статусы модерации, лимит фото 2MB, EMPTY_EVENT_FORM
│   ├── Toast.jsx
│   └── components/         # AppHeader, AppNav, EventFormSection, FeedSection,
│                           # EventDetailSection, MyEventsSection, ModerationPanel,
│                           # AdminStatsBar, EventPointPicker
└── docs/HANDOFF_NEXT_AGENT.md  # этот файл
```

---

## 3. Запуск

1. Node.js LTS + PostgreSQL, БД `cultural_navigator`
2. `server/.env` из `server/.env.example`:
   - `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAILS` (email → роль ADMIN при регистрации)
3. Корень:
   ```bash
   npm install
   npm run db:migrate
   npm --workspace server run db:seed
   ```
4. Два терминала:
   - `npm run dev:server` → **http://localhost:4000**
   - `npm run dev:client` → **http://localhost:5173**
5. Сайт открывать на **5173**, не на 4000. Health: `GET http://localhost:4000/health`

---

## 4. База данных (`db/schema.sql`)

- **users** — `USER` | `ADMIN`
- **categories**, **districts** — сиды в `db/seed.sql`
- **events** — `event_type`, `moderation_status`, `image_url` (URL или base64), geo, `moderation_comment`, `created_by`, …
- **favorites**, **reviews** (1 отзыв на user+event), **event_registrations**

Правила:
- Публичная лента — только `APPROVED`
- `COMMUNITY` при создании → `PENDING`; `OFFICIAL` от ADMIN → `APPROVED`
- Отзыв — после `ends_at`, только `APPROVED`
- Запись на событие — только `APPROVED`

---

## 5. Backend API (`/api`)

Подключение: `server/src/app.js`.

### Auth
- `POST /auth/register` — email, password, displayName
- `POST /auth/login`
- `GET /auth/me` — Bearer

### Events
- `GET /events` — публично, только `APPROVED`; query: `q`, `categoryId`, `districtId`, `type`, `dateFrom`, `dateTo`, **`page`**, **`limit`** (default 10); ответ: `{ items, total, page, limit, totalPages }`
- `GET /events/:eventId` — **optionalAuth**: APPROVED всем; иначе только организатор или ADMIN
- `POST /events` — создание (auth)
- **`PATCH /events/:eventId`** — редактирование (организатор или ADMIN); community от пользователя → снова `PENDING`, comment сбрасывается
- `DELETE /events/:eventId` — организатор или ADMIN
- `POST/DELETE /events/:eventId/attend` — запись/отмена
- `GET /events/:eventId/participants` — организатор или ADMIN

### Admin
- **`GET /admin/stats`** — счётчики users/events/registrations/reviews/favorites + moderation по статусам
- `GET /admin/events/moderation-queue` — query `status` опционально
- `PATCH /admin/events/:eventId/moderation` — `NEEDS_EDIT` | `APPROVED` | `REJECTED` + `moderationComment`

### Meta
- `GET /meta/categories`, `GET /meta/districts`
- `GET /meta/geocode?q=` — прокси Nominatim (User-Agent)

### Favorites, Reviews, Me
- Favorites: GET/POST, DELETE `/:eventId`
- Reviews: GET by event, POST upsert
- Me: profile, created-events, attending-events

### Валидация изображений (`server/src/schemas/events.js`)
- `imageUrl`: пусто, `http(s)://`, или `data:image/...;base64,...` (max ~5MB в схеме)
- Body limit Express: **8mb** (`server/src/app.js`)

---

## 6. Frontend

### Навигация (hash)
`client/src/constants.js` → `PAGES`: `feed`, `event`, `moderation`, `profile`, `my-events`, `attending`, `favorites`.

Примеры: `#feed`, `#event/<uuid>`, `#moderation`.

`App.jsx` — состояние, эффекты, обработчики; UI вынесен в `components/`.

### Основные фичи UI
- **Гость:** лента, фильтры, карта; избранное в `localStorage` (`cultural-navigator:guest-favorites`)
- **Вход:** форма в шапке (`AppHeader`), после входа только «Выход»
- **Создание/редактирование** (`EventFormSection`): геокодинг, клик по карте, фото URL/файл ≤2MB, превью
- **Лента** (`FeedSection`): фильтры, debounce поиска 300ms, пагинация, счётчик «Найдено: N»
- **Мои мероприятия:** статусы по-русски, комментарий модератора, редактирование
- **Модерация:** фильтр статуса, комментарий, статистика (`AdminStatsBar`)
- **Toast** — успех/ошибки для основных действий
- **Баннер** если API недоступен (нет demo-fallback)

### API клиент (`client/src/api.js`)
- `API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api"`
- `getEvents(filters, { page, limit })` → объект с pagination
- `parseApiError` — текст ошибки с бэка
- **Нет** demo-events fallback (удалён)

---

## 7. История сессий (важно для контекста)

### Исправленные баги
1. **Создание мероприятия не работало** — `imageUrl: z.string().url()` отклонял `""` и `data:image/...`; исправлено refine в `events.js`
2. **Payload >100KB** — base64 фото; `express.json({ limit: "8mb" })`
3. **Белый экран** — `filters` использовался в `useEffect` **до** `useState(filters)`; перенесены объявления state выше
4. **Кнопка «Отправить» «молчала»** — добавлены toast и явные ошибки в `api.js` / `App.jsx`

### Добавлено в сессиях
- Редактирование событий (`PATCH`)
- Статусы модерации RU + бейджи
- Toast, лимит/превью фото
- Убрана дублирующая client-side фильтрация ленты (только сервер)
- Пагинация ленты (10/стр)
- `GET /admin/stats`
- Разбиение UI на компоненты в `client/src/components/`
- `optionalAuth` для просмотра своих неодобренных событий

---

## 8. Соответствие отчёту `ОЧТЁТ МДП (6).docx`

Отчёт — проектирование + User Stories с «идеальным» UI. Код закрывает **~70–75%** функционала.

### Сделано (ядро)
- Роли гость / пользователь / админ
- Лента, карта, геопривязка, OFFICIAL vs COMMUNITY
- Регистрация/вход, избранное, создание, модерация, отзывы
- CRUD событий + редактирование + повторная модерация
- Запись на событие, участники (сверх отчёта)

### Частично
- Фильтры (нет множественных категорий, нет фильтра «тип» в UI, нет календаря как в макете)
- Личный кабинет (нет аватара, телефона)
- Контакт организатора — текст, не кликабельные VK/Telegram
- Уведомления — toast + статус в списке, не push/email
- Валидация — базовая, без подсветки полей

### Не сделано (из отчёта)
- Подтверждение пароля при регистрации
- Верификация телефона перед созданием события
- Autocomplete поиска в шапке
- Антиспам / запрещённые слова
- Админ: управление пользователями, CRUD категорий/районов в UI
- Интеграция «как в отчёте» (отдельные ссылки на мессенджеры)
- react-router (всё ещё hash в App.jsx)

---

## 9. Известные ограничения / техдолг

- `image_url` base64 в PostgreSQL — для курсовой ок, для прод — файлы + URL
- `API_BASE` можно задать через `VITE_API_URL`, иначе localhost:4000
- `App.jsx` всё ещё крупный (логика), компоненты — в основном presentational
- Фильтр `type` (OFFICIAL/COMMUNITY) есть в API `GET /events`, **нет в UI**
- При смене фильтров страница сбрасывается на 1; возможен двойной запрос при mount
- Временный мусор от отладки docx: `_docx_extract/`, `_report.zip`, `_report_text.txt` — можно удалить
- `README.md` устарел относительно полного функционала

---

## 10. Идеи развития (BlaBlaCar как референс UX)

Не копировать BlaBlaCar буквально (это не попутки), а **перенести паттерны доверия и бронирования**:

| BlaBlaCar | Аналог в «Культурном Навигаторе» |
|-----------|----------------------------------|
| Профиль + фото + верификация | Аватар, телефон (опционально подтверждён), «организатор с N событий» |
| Поиск: откуда–куда–когда | Район + категория + дата + «рядом со мной» |
| Чёткий статус поездки | Статусы мероприятия + статус **записи** (записан / отменён / мероприятие отменено) |
| Бронирование мест | Запись на событие + **лимит мест** (`max_participants`) |
| Уведомления о смене статуса | In-app «колокольчик» / email при одобрении/отклонении/напоминании за день |
| Отзывы после поездки | Уже есть; добавить «только кто был» (проверка registration) |
| Чат / контакт | Кликабельные Telegram/VK/телефон в карточке |
| Доверие и модерация | Уже есть; усилить жалобы «пожаловаться на событие» |
| Прозрачная отмена | Организатор отменяет событие → уведомить записавшихся |

### Приоритеты для следующего агента

**P0 — для защиты / отчёта**
1. Регистрация: подтверждение пароля, сообщения на русском, подсветка полей
2. Фильтр «Официальное / От жителей» в ленте (API уже есть)
3. Уведомления в ЛК: «мероприятие одобрено / нужны правки / отклонено»
4. Контакт организатора: поля telegram/vk/phone + кликабельные ссылки
5. Обновить `README.md` и `docs/backend-stage1.md` под текущий API

**P1 — сильно улучшит продукт**
6. Лимит участников + «осталось N мест»
7. Профиль: редактирование имени, телефона, аватар (файл или URL)
8. Центр уведомлений (таблица `notifications` в БД)
9. Загрузка фото в `server/uploads/` вместо base64
10. react-router вместо hash (опционально)

**P2 — nice to have**
11. Календарный вид ленты
12. QR на странице события
13. «Похожие события»
14. Экспорт CSV для админа
15. Автодополнение поиска

---

## 11. Файлы «смотреть первым»

| Задача | Файлы |
|--------|--------|
| Новый API | `server/src/routes/*.js`, `server/src/schemas/*.js`, `server/src/app.js` |
| UI | `client/src/App.jsx`, `client/src/components/*`, `client/src/api.js` |
| БД | `db/schema.sql`, `db/seed.sql` |
| Auth/роли | `server/src/routes/auth.js`, `server/src/config/env.js` |
| События | `server/src/routes/events.js`, `server/src/schemas/events.js` |
| Модерация | `server/src/routes/admin.js` |

---

## 12. Команды проверки

```bash
cd client && npm run build    # должен проходить без ошибок
npm run dev:server
npm run dev:client
```

Типичный тест:
1. Регистрация → вход
2. Создать community-событие → «На модерации» в «Мои мероприятия»
3. ADMIN → панель модератора → одобрить
4. Событие в ленте → записаться → отзыв после даты окончания

---

## 13. Git / деплой

- Репозиторий пользователя: `https://github.com/Kukushka000111/MDP_2026`
- `server/.env` не коммитить
- Пользователь просил **не коммитить** без явной просьбы

---

*Обновлено: май 2026. Сессия: исправление создания событий, итерация улучшений UI, пагинация, компоненты, handoff для следующего агента.*

# Культурный Навигатор

Веб-сервис агрегации городских мероприятий (курсовой проект МДП): лента, карта, премодерация, избранное, запись на события и отзывы.

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Leaflet |
| Backend | Node.js, Express 4, PostgreSQL, JWT, Zod |
| Monorepo | npm workspaces (`server/`, `client/`) |

## Возможности

- Роли: гость, пользователь, администратор
- Лента и карта с фильтрами (категория, даты, официальные / от жителей), пагинация
- Регистрация и вход, светлая и тёмная тема (сохранение в профиле)
- Создание и редактирование мероприятий, выбор точки на карте
- Контакты организатора: телефон, Telegram, VK
- Премодерация community-событий, панель админа, жалобы, уведомления
- Избранное (гость + синхронизация после входа)
- Запись на мероприятие с лимитом мест, отзывы после окончания

## Запуск в Docker (демо)

Нужен Docker Desktop. В корне репозитория:

```bash
docker compose up --build
```

Сайт: http://localhost:8080 · Проверка API: http://localhost:8080/health

Опционально: `.env.docker.example` → `.env` (задать `JWT_SECRET`, `ADMIN_EMAILS`).

| Команда | Назначение |
|---------|------------|
| `docker compose up --build` | Собрать и запустить |
| `docker compose down` | Остановить |
| `docker compose down -v` | Остановить и удалить данные БД |
| `docker compose logs -f api` | Логи backend |

При старте API выполняет `db/schema.sql` и `db/seed.sql`.

## Запуск без Docker (разработка)

1. Node.js LTS и PostgreSQL, база `cultural_navigator`.
2. `server/.env.example` → `server/.env` (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAILS`).
3. В корне:

```bash
npm install
npm run db:migrate
npm --workspace server run db:seed
```

4. `npm run dev:server` → http://localhost:4000  
5. `npm run dev:client` → http://localhost:5173  

Опционально: `client/.env` с `VITE_API_URL=http://localhost:4000/api`

## Сборка фронтенда

```bash
cd client && npm run build
```

## Документация

| Документ | Для чего |
|----------|----------|
| [`docs/POYASNITELNAYA_ZAPISKA.md`](docs/POYASNITELNAYA_ZAPISKA.md) | Полное описание системы и функционала — **отчёт, пояснительная записка** |
| [`docs/PODGOTOVKA_K_ZASHCHITE.md`](docs/PODGOTOVKA_K_ZASHCHITE.md) | Архитектура, демо-сценарий, ответы на вопросы — **защита** |
| [`docs/README.md`](docs/README.md) | Оглавление папки `docs/` |

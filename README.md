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
- Лента и карта с фильтрами (категория, район, даты, **официальные / от жителей**), пагинация
- Регистрация и вход (подтверждение пароля, ошибки на русском)
- Создание и редактирование мероприятий, геокодинг адреса
- Контакты организатора: телефон, Telegram, VK (кликабельные ссылки)
- Премодерация community-событий, панель админа, **уведомления о решении модерации**
- Избранное (гость + синхронизация после входа)
- Запись на мероприятие с **лимитом мест** («осталось N мест»), отзывы после окончания (только для записавшихся)
- Редактирование профиля: имя, телефон, аватар (URL)

## Запуск

1. Node.js LTS и PostgreSQL, база `cultural_navigator`.
2. Скопировать `server/.env.example` → `server/.env`, заполнить `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAILS`.
3. В корне репозитория:

```bash
npm install
npm run db:migrate
npm --workspace server run db:seed
```

4. Терминал 1: `npm run dev:server` → http://localhost:4000  
5. Терминал 2: `npm run dev:client` → http://localhost:5173  

Проверка API: `GET http://localhost:4000/health`

Опционально для клиента: `client/.env` с `VITE_API_URL=http://localhost:4000/api`

## Документация

- `docs/backend-stage1.md` — описание API
- `docs/DEMO_DEFENSE.md` — сценарий показа на защите
- `docs/HANDOFF_NEXT_AGENT.md` — полный контекст для разработки
- `PROJECT_HANDOFF.md` — обзор архитектуры

## Сборка

```bash
cd client && npm run build
```

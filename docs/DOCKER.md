# Запуск в Docker

Одна команда поднимает PostgreSQL, API (Express) и веб-интерфейс (React + nginx).

## Схема

```
Браузер → web:80 (nginx)
            ├── /        → статика React (client/dist)
            └── /api/*   → proxy → api:4000

api → db:5432 (PostgreSQL)
```

При старте `api` автоматически выполняет `db/schema.sql` и `db/seed.sql`.

## Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) или Docker Engine + Compose v2

## Быстрый старт

1. В корне репозитория (опционально):

```bash
copy .env.docker.example .env
```

Отредактируйте `JWT_SECRET` и `ADMIN_EMAILS` в `.env`.

2. Сборка и запуск:

```bash
docker compose up --build
```

3. Откройте в браузере: **http://localhost:8080**  
   (порт меняется переменной `WEB_PORT` в `.env`)

4. Проверка API через nginx: **http://localhost:8080/health** → `{"ok":true}`

## Полезные команды

| Команда | Назначение |
|---------|------------|
| `docker compose up --build` | Собрать образы и запустить |
| `docker compose up -d` | Запуск в фоне |
| `docker compose down` | Остановить контейнеры |
| `docker compose down -v` | Остановить и **удалить данные БД** |
| `docker compose logs -f api` | Логи backend |
| `docker compose ps` | Статус сервисов |

## Переменные окружения

| Переменная | Где | По умолчанию |
|------------|-----|--------------|
| `JWT_SECRET` | api | `change-me-for-docker` |
| `ADMIN_EMAILS` | api | `admin@example.com` |
| `WEB_PORT` | web (порт на хосте) | `8080` |

Пароль PostgreSQL в compose зафиксирован (`postgres` / `cultural_navigator`) — для локального демо; в продакшене вынесите в secrets.

## Разработка без Docker

Как раньше: `npm install`, `npm run db:migrate`, два терминала `dev:server` и `dev:client`.  
Docker не заменяет dev-режим с hot-reload — он для **демо и сдачи** на чистой машине.

## Что сказать на защите (кратко)

1. Три сервиса в `docker-compose.yml`: БД, API, фронт с nginx.
2. Фронт обращается к API по относительному пути `/api` — nginx проксирует на контейнер `api`.
3. API подключается к БД по имени хоста `db` внутри сети Docker.
4. Миграции и сиды выполняются при каждом старте API (идемпотентный `schema.sql` и `ON CONFLICT` в seed).

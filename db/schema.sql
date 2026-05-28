CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('OFFICIAL', 'COMMUNITY');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
    CREATE TYPE moderation_status AS ENUM ('PENDING', 'NEEDS_EDIT', 'APPROVED', 'REJECTED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_gender') THEN
    CREATE TYPE user_gender AS ENUM ('MALE', 'FEMALE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
    CREATE TYPE registration_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  vk_url TEXT,
  telegram TEXT,
  bio TEXT,
  gender user_gender,
  is_adult BOOLEAN NOT NULL DEFAULT FALSE,
  rules_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  role user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  address TEXT NOT NULL,
  address_public BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  organizer_name TEXT NOT NULL,
  organizer_contact TEXT,
  organizer_phone TEXT,
  organizer_telegram TEXT,
  organizer_vk TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  event_type event_type NOT NULL,
  moderation_status moderation_status NOT NULL DEFAULT 'PENDING',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  moderation_comment TEXT,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT event_time_check CHECK (ends_at >= starts_at),
  CONSTRAINT event_coords_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  )
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS login TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS vk_url TEXT,
  ADD COLUMN IF NOT EXISTS telegram TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS gender user_gender,
  ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rules_accepted BOOLEAN DEFAULT FALSE;

UPDATE users
SET login = COALESCE(login, split_part(email, '@', 1) || '_' || substr(id::text, 1, 4))
WHERE login IS NULL;

UPDATE users
SET first_name = COALESCE(NULLIF(first_name, ''), split_part(display_name, ' ', 1)),
    last_name = COALESCE(NULLIF(last_name, ''), COALESCE(NULLIF(split_part(display_name, ' ', 2), ''), '—'))
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login ON users (login);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS address_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS organizer_phone TEXT,
  ADD COLUMN IF NOT EXISTS organizer_telegram TEXT,
  ADD COLUMN IF NOT EXISTS organizer_vk TEXT,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER;

CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS event_registrations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  status registration_status NOT NULL DEFAULT 'PENDING',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status registration_status DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

UPDATE event_registrations SET status = 'APPROVED' WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);

ALTER TABLE events DROP COLUMN IF EXISTS district_id;
DROP TABLE IF EXISTS districts CASCADE;

CREATE INDEX IF NOT EXISTS idx_events_public_filters
  ON events (moderation_status, starts_at, category_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_title_search
  ON events USING GIN (to_tsvector('simple', title));

CREATE INDEX IF NOT EXISTS idx_reviews_event
  ON reviews (event_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event
  ON event_registrations (event_id);

-- Category catalog refresh (safe on existing databases)
UPDATE categories SET name = 'Кино & Театр' WHERE name = 'Кино';
UPDATE categories SET name = 'Концерты & Вечеринки' WHERE name = 'Концерты';
UPDATE categories SET name = 'Спорт & Активный отдых' WHERE name = 'Спорт';
UPDATE categories SET name = 'Лекции & Воркшопы' WHERE name = 'Лекции';

UPDATE events e
SET category_id = lec.id
FROM categories lec, categories mc
WHERE lec.name = 'Лекции & Воркшопы'
  AND mc.name = 'Мастер-классы'
  AND e.category_id = mc.id;

DELETE FROM categories WHERE name = 'Мастер-классы';

INSERT INTO categories (name)
VALUES
  ('Кино & Театр'),
  ('Концерты & Вечеринки'),
  ('Лекции & Воркшопы'),
  ('Спорт & Активный отдых'),
  ('Выставки & Арт'),
  ('Квизы & Настолки'),
  ('Ламповые тусовки')
ON CONFLICT (name) DO NOTHING;

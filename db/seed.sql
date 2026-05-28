INSERT INTO categories (name)
VALUES
  ('Кино'),
  ('Спорт'),
  ('Лекции'),
  ('Мастер-классы'),
  ('Концерты')
ON CONFLICT (name) DO NOTHING;

INSERT INTO districts (name)
VALUES
  ('Центральный'),
  ('Северный'),
  ('Южный'),
  ('Западный'),
  ('Восточный')
ON CONFLICT (name) DO NOTHING;

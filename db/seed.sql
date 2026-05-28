INSERT INTO categories (name)
VALUES
  ('Кино'),
  ('Спорт'),
  ('Лекции'),
  ('Мастер-классы'),
  ('Концерты')
ON CONFLICT (name) DO NOTHING;

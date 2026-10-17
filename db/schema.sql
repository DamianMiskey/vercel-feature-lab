-- Guestbook for the Postgres demo (/postgres). Safe to run repeatedly:
--   npm run db:migrate
-- The CHECK constraints repeat the app's own limits, so bad rows can't get in
-- even through another client.
CREATE TABLE IF NOT EXISTS lab_notes (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author     text        NOT NULL CHECK (char_length(author) BETWEEN 1 AND 30),
  body       text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 280),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lab_notes_created_at_idx ON lab_notes (created_at DESC);

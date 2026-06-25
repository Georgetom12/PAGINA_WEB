import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function ensureSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS psy_members (
        id            SERIAL PRIMARY KEY,
        username      TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name  TEXT NOT NULL,
        email         TEXT,
        plan          TEXT NOT NULL DEFAULT 'basico',
        expires_at    TIMESTAMPTZ,
        active        BOOLEAN NOT NULL DEFAULT TRUE,
        notes         TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_operators (
        id            SERIAL PRIMARY KEY,
        username      TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name  TEXT NOT NULL,
        active        BOOLEAN NOT NULL DEFAULT TRUE,
        created_by    TEXT NOT NULL DEFAULT 'superadmin',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS api_config (
        key_name    TEXT PRIMARY KEY,
        key_value   TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_signals (
        id         SERIAL PRIMARY KEY,
        pair       TEXT NOT NULL,
        direction  TEXT NOT NULL,
        entry      TEXT NOT NULL,
        targets    TEXT NOT NULL,
        stop_loss  TEXT,
        timeframe  TEXT,
        category   TEXT DEFAULT 'crypto',
        status     TEXT NOT NULL DEFAULT 'active',
        notes      TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_channels (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        description TEXT,
        active      BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_channel_bots (
        id          SERIAL PRIMARY KEY,
        channel_id  INTEGER REFERENCES psy_channels(id) ON DELETE CASCADE,
        bot_token   TEXT NOT NULL,
        chat_id     TEXT NOT NULL,
        active      BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_certificates (
        id          SERIAL PRIMARY KEY,
        member_id   INTEGER REFERENCES psy_members(id) ON DELETE CASCADE,
        course_name TEXT NOT NULL,
        issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        code        TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS psy_chat (
        id         SERIAL PRIMARY KEY,
        member_id  INTEGER REFERENCES psy_members(id) ON DELETE CASCADE,
        role       TEXT NOT NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_exchange_submissions (
        id           SERIAL PRIMARY KEY,
        token_name   TEXT NOT NULL,
        symbol       TEXT NOT NULL,
        website      TEXT NOT NULL,
        whitepaper   TEXT,
        contract     TEXT,
        chain        TEXT NOT NULL DEFAULT 'ETH',
        description  TEXT,
        twitter      TEXT,
        telegram     TEXT,
        hard_cap     TEXT,
        email        TEXT NOT NULL,
        member_user  TEXT,
        member_plan  TEXT,
        score_boost  INTEGER NOT NULL DEFAULT 0,
        status       TEXT NOT NULL DEFAULT 'pending',
        admin_notes  TEXT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id         SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        role       TEXT NOT NULL,
        content    TEXT NOT NULL,
        source     TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
    `);
    logger.info("Schema verified / created OK");
  } catch (err) {
    logger.error({ err }, "Error ensuring schema — server will still start");
  } finally {
    client.release();
  }
}

import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function ensureSchema(): Promise<void> {
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    logger.warn({ err }, "DB unreachable at startup — skipping schema check, server will still start");
    return;
  }
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

      CREATE TABLE IF NOT EXISTS trader_snapshots (
        id               SERIAL PRIMARY KEY,
        trader_id        TEXT NOT NULL,
        display_name     TEXT NOT NULL,
        coin             TEXT NOT NULL DEFAULT 'BTC',
        exchange         TEXT NOT NULL DEFAULT 'unknown',
        position         TEXT NOT NULL DEFAULT 'LONG',
        oi_usd           NUMERIC,
        pnl_24h          NUMERIC,
        pnl_cumulative   NUMERIC NOT NULL DEFAULT 0,
        win_rate         NUMERIC,
        price_change_24h NUMERIC,
        funding_rate     NUMERIC,
        signal           TEXT,
        ts               BIGINT NOT NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS trader_snapshots_trader_id_ts_idx ON trader_snapshots(trader_id, ts DESC);
    `);
    // ── Tablas Telegram listener (legacy — kept for backward compat) ──────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS tg_whale_alerts (
        id           SERIAL PRIMARY KEY,
        source       VARCHAR(50) NOT NULL,
        exchange     VARCHAR(100),
        coin         VARCHAR(20),
        pair         VARCHAR(30),
        clase        VARCHAR(80),
        rating       INTEGER,
        direccion    VARCHAR(10),
        tamano_usd   BIGINT,
        cantidad     DECIMAL(20,8),
        precio       DECIMAL(20,8),
        wallet       VARCHAR(100),
        mensaje      TEXT,
        raw_text     TEXT,
        ts           BIGINT NOT NULL,
        created_at   TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tg_gem_alerts (
        id               SERIAL PRIMARY KEY,
        source           VARCHAR(50) NOT NULL,
        symbol           VARCHAR(30),
        address          VARCHAR(100),
        chain            VARCHAR(20),
        hold_score       INTEGER,
        precio           DECIMAL(20,10),
        lp_usd           DECIMAL(20,2),
        vol_24h          DECIMAL(20,2),
        cambio_1h        DECIMAL(10,2),
        buys_1h          INTEGER,
        sells_1h         INTEGER,
        rugcheck_risks   TEXT,
        tipo             VARCHAR(20) DEFAULT 'new_token',
        monto_usd        DECIMAL(20,2),
        tx_url           TEXT,
        raw_text         TEXT,
        ts               BIGINT NOT NULL,
        created_at       TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tg_psy_signals (
        id               SERIAL PRIMARY KEY,
        tier             VARCHAR(30),
        symbol           VARCHAR(30),
        timeframe        VARCHAR(10),
        tipo             VARCHAR(10),
        score            DECIMAL(5,2),
        confianza        VARCHAR(20),
        precio           DECIMAL(20,8),
        rsi              DECIMAL(6,2),
        ema_9            DECIMAL(20,8),
        ema_21           DECIMAL(20,8),
        ema_50           DECIMAL(20,8),
        ema_200          DECIMAL(20,8),
        cvd              DECIMAL(20,2),
        resistencia      DECIMAL(20,8),
        soporte          DECIMAL(20,8),
        score_tecnico    INTEGER,
        score_patron     INTEGER,
        score_sentiment  INTEGER,
        raw_text         TEXT,
        ts               BIGINT NOT NULL,
        created_at       TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Tablas Telegram V2 (multi-bot, 4 canales reales) ─────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS whale_alerts_tg (
        id          SERIAL PRIMARY KEY,
        bot_source  VARCHAR(50),
        exchange    VARCHAR(50),
        coin        VARCHAR(20),
        pair        VARCHAR(30),
        clase       VARCHAR(80),
        rating      INTEGER,
        direccion   VARCHAR(10),
        tamano_usd  BIGINT,
        cantidad    DECIMAL(20,8),
        precio      DECIMAL(20,8),
        wallet      VARCHAR(200),
        upnl        BIGINT,
        cuenta_usd  BIGINT,
        posiciones  TEXT,
        mensaje     TEXT,
        raw_text    TEXT,
        ts          BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gem_alerts_tg (
        id          SERIAL PRIMARY KEY,
        bot_source  VARCHAR(50),
        tipo        VARCHAR(30),
        symbol      VARCHAR(30),
        address     VARCHAR(200),
        chain       VARCHAR(20),
        hold_score  INTEGER,
        precio      DECIMAL(20,12),
        lp_usd      DECIMAL(20,2),
        fdv         DECIMAL(20,2),
        vol_1h      DECIMAL(20,2),
        cambio_1h   DECIMAL(10,2),
        cambio_24h  DECIMAL(10,2),
        buys_1h     INTEGER,
        sells_1h    INTEGER,
        edad_min    INTEGER,
        monto_usd   DECIMAL(20,2),
        lp_pool     DECIMAL(20,2),
        tx_url      TEXT,
        dex_url     TEXT,
        raw_text    TEXT,
        ts          BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_signals_tg (
        id              SERIAL PRIMARY KEY,
        bot_source      VARCHAR(50),
        tier            VARCHAR(50),
        symbol          VARCHAR(30),
        timeframe       VARCHAR(10),
        tipo            VARCHAR(10),
        score           DECIMAL(5,2),
        confianza       VARCHAR(20),
        precio          DECIMAL(20,8),
        rsi             DECIMAL(6,2),
        ema_9           DECIMAL(20,8),
        ema_21          DECIMAL(20,8),
        ema_50          DECIMAL(20,8),
        ema_200         DECIMAL(20,8),
        cvd             DECIMAL(20,2),
        bb_b            DECIMAL(8,4),
        macd            DECIMAL(20,8),
        resistencia     DECIMAL(20,8),
        soporte         DECIMAL(20,8),
        score_tecnico   INTEGER,
        score_patron    INTEGER,
        score_sentiment INTEGER,
        win_rate        DECIMAL(5,1),
        retorno_prom    DECIMAL(8,2),
        raw_text        TEXT,
        ts              BIGINT NOT NULL,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exchange_alerts_tg (
        id          SERIAL PRIMARY KEY,
        bot_source  VARCHAR(50),
        exchange    VARCHAR(50),
        coin        VARCHAR(20),
        pair        VARCHAR(30),
        direccion   VARCHAR(10),
        clase       VARCHAR(80),
        rating      INTEGER,
        tamano_usd  BIGINT,
        cantidad    DECIMAL(20,8),
        precio      DECIMAL(20,8),
        mensaje     TEXT,
        raw_text    TEXT,
        ts          BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_psy_signals_tg_dedup
        ON psy_signals_tg (ts, symbol) WHERE symbol IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_alerts_tg_dedup
        ON exchange_alerts_tg (ts, pair, exchange) WHERE pair IS NOT NULL;
    `);

    // ── psy_whitelist ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS psy_whitelist (
        id          SERIAL PRIMARY KEY,
        email       TEXT NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        notified    BOOLEAN NOT NULL DEFAULT FALSE,
        notified_at TIMESTAMPTZ
      );
    `);

    // ── Migración R6: agregar columna email_verified si no existe ──
    // DEFAULT true: todos los miembros existentes quedan verificados automáticamente.
    // Los nuevos registros (exchange) la reciben en false vía el flujo de registro.
    await client.query(`
      ALTER TABLE psy_members
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true
    `);

    // ── PRO DASHBOARD: watchlist, alertas, conexión de exchange, track record ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS psy_watchlist (
        id         SERIAL PRIMARY KEY,
        username   TEXT NOT NULL,
        symbol     TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(username, symbol)
      );

      CREATE TABLE IF NOT EXISTS psy_alerts (
        id           SERIAL PRIMARY KEY,
        username     TEXT NOT NULL,
        symbol       TEXT NOT NULL,
        metric       TEXT NOT NULL,
        condition    TEXT NOT NULL,
        threshold    NUMERIC NOT NULL,
        active       BOOLEAN NOT NULL DEFAULT TRUE,
        triggered_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_exchange_keys (
        id              SERIAL PRIMARY KEY,
        username        TEXT NOT NULL UNIQUE,
        exchange        TEXT NOT NULL DEFAULT 'binance',
        api_key_enc     TEXT NOT NULL,
        api_secret_enc  TEXT NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_track_record (
        id            SERIAL PRIMARY KEY,
        symbol        TEXT NOT NULL,
        motor         TEXT NOT NULL,
        direccion     TEXT NOT NULL,
        entrada       NUMERIC,
        resultado_pct NUMERIC,
        estado        TEXT NOT NULL DEFAULT 'PENDIENTE',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at     TIMESTAMPTZ
      );
    `);

    logger.info("Schema verified / created OK");
  } catch (err) {
    logger.error({ err }, "Error ensuring schema — server will still start");
  } finally {
    client.release();
  }
}

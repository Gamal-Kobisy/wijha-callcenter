-- ============================================================
-- Enum: user_role
-- ============================================================
DO $$ BEGIN
    CREATE TYPE "user_role" AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Table: project
-- ============================================================
CREATE TABLE IF NOT EXISTS "project" (
    "id"          SERIAL       PRIMARY KEY,
    "name"        VARCHAR(100) NOT NULL,
    "description" TEXT
);

-- ============================================================
-- Table: user
-- ============================================================
CREATE TABLE IF NOT EXISTS "user" (
    "id"            SERIAL PRIMARY KEY,
    "email"         VARCHAR(50)  NOT NULL,
    "phone_number"  VARCHAR(20)  NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name"          VARCHAR(50),
    "role"          "user_role"  NOT NULL,
    "otp"           VARCHAR(6),
    "otp_expiry"    TIMESTAMP,
    "jwt_token"     TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user" ("email");

-- ============================================================
-- Table: owner
-- ============================================================
CREATE TABLE IF NOT EXISTS "owner" (
    "id"             BIGSERIAL PRIMARY KEY,
    "name"           VARCHAR(50),
    "status"         VARCHAR(50),
    "attempt_count"  INTEGER,
    "last_dialed_at" TIMESTAMP,
    "next_dial_at"   TIMESTAMP
);

-- ============================================================
-- Table: numbers
-- ============================================================
CREATE TABLE IF NOT EXISTS "numbers" (
    "number"   VARCHAR(20) NOT NULL,
    "owner_id" BIGINT      NOT NULL,
    PRIMARY KEY ("number", "owner_id"),
    CONSTRAINT "numbers_owner_id_fkey" FOREIGN KEY ("owner_id")
        REFERENCES "owner" ("id") ON DELETE CASCADE
);

-- ============================================================
-- Table: owner_info
-- ============================================================
CREATE TABLE IF NOT EXISTS "owner_info" (
    "key"      VARCHAR(60) NOT NULL,
    "owner_id" BIGINT      NOT NULL,
    "value"    VARCHAR(60) NOT NULL,
    PRIMARY KEY ("key", "owner_id"),
    CONSTRAINT "owner_info_owner_id_fkey" FOREIGN KEY ("owner_id")
        REFERENCES "owner" ("id") ON DELETE CASCADE
);

-- ============================================================
-- Table: call_detail_record
-- ============================================================
CREATE TABLE IF NOT EXISTS "call_detail_record" (
    "id"             BIGSERIAL    PRIMARY KEY,
    "owner_id"       BIGINT,
    "agent_id"       INTEGER,
    "status"         VARCHAR(50),
    "time"           TIMESTAMP    NOT NULL,
    "duration"       INTEGER,
    "agent_notes"    TEXT,
    CONSTRAINT "call_detail_record_owner_id_fkey" FOREIGN KEY ("owner_id")
        REFERENCES "owner" ("id") ON DELETE CASCADE,
    CONSTRAINT "call_detail_record_agent_id_fkey" FOREIGN KEY ("agent_id")
        REFERENCES "user" ("id")
);

-- ============================================================
-- Table: user_log
-- ============================================================
CREATE TABLE IF NOT EXISTS "user_log" (
    "id"         BIGSERIAL PRIMARY KEY,
    "agent_id"   INTEGER,
    "start_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration"   INTEGER,
    "is_active"  BOOLEAN,
    CONSTRAINT "user_log_agent_id_fkey" FOREIGN KEY ("agent_id")
        REFERENCES "user" ("id")
);

-- ============================================================
-- Table: project_call_detail_record
-- ============================================================
CREATE TABLE IF NOT EXISTS "project_call_detail_record" (
    "project_id"            INTEGER NOT NULL,
    "call_detail_record_id" BIGINT  NOT NULL,
    PRIMARY KEY ("project_id", "call_detail_record_id"),
    CONSTRAINT "project_call_detail_record_project_id_fkey" FOREIGN KEY ("project_id")
        REFERENCES "project" ("id"),
    CONSTRAINT "project_call_detail_record_call_detail_record_id_fkey" FOREIGN KEY ("call_detail_record_id")
        REFERENCES "call_detail_record" ("id")
);

-- ============================================================
-- Table: owner_project
-- ============================================================
CREATE TABLE IF NOT EXISTS "owner_project" (
    "owner_id"   BIGINT  NOT NULL,
    "project_id" INTEGER NOT NULL,
    PRIMARY KEY ("owner_id", "project_id"),
    CONSTRAINT "owner_project_owner_id_fkey" FOREIGN KEY ("owner_id")
        REFERENCES "owner" ("id") ON DELETE CASCADE,
    CONSTRAINT "owner_project_project_id_fkey" FOREIGN KEY ("project_id")
        REFERENCES "project" ("id")
);

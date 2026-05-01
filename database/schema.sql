-- ============================================================
-- Testimo Database Schema
-- All statements use IF NOT EXISTS — safe to re-run.
-- ============================================================

CREATE DATABASE IF NOT EXISTS testimo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE testimo;

-- ============================================================
-- users: core identity (populated on first Google sign-in)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  avatar_url    TEXT,
  google_id     VARCHAR(255),
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email    (email),
  UNIQUE KEY uq_users_google   (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- accounts: OAuth provider tokens (supports future providers)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id               CHAR(36)     NOT NULL,
  provider              VARCHAR(50)  NOT NULL,         -- 'google'
  provider_account_id   VARCHAR(255) NOT NULL,
  access_token          TEXT,
  refresh_token         TEXT,
  expires_at            BIGINT,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider_account (provider, provider_account_id),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- sessions: DB-backed NextAuth sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id         CHAR(36)     NOT NULL,
  session_token   VARCHAR(512) NOT NULL,
  expires         TIMESTAMP    NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_token (session_token),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- workspaces: each user's brand / project space
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  owner_id    CHAR(36)     NOT NULL,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) NOT NULL,              -- used in public URLs
  logo_url    TEXT,
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'canceled'
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_slug (slug),
  CONSTRAINT fk_workspaces_owner FOREIGN KEY (owner_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- workspace_members: team collaboration (future)
-- ============================================================
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id  CHAR(36)                          NOT NULL,
  user_id       CHAR(36)                          NOT NULL,
  role          ENUM('owner','admin','viewer')     NOT NULL DEFAULT 'viewer',
  joined_at     TIMESTAMP                         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, user_id),
  CONSTRAINT fk_wm_workspace FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_wm_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- collection_forms: shareable forms to request testimonials
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_forms (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  workspace_id  CHAR(36)     NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  -- JSON array of { id, label, type: 'text'|'rating', required }
  questions     JSON,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_forms_workspace FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- testimonials: the core entity of the platform
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id                  CHAR(36)                                        NOT NULL DEFAULT (UUID()),
  workspace_id        CHAR(36)                                        NOT NULL,
  form_id             CHAR(36),                                       -- NULL if added manually or via CSV
  submitter_name      VARCHAR(255),
  submitter_email     VARCHAR(255),
  submitter_title     VARCHAR(255),
  submitter_company   VARCHAR(255),
  submitter_avatar    TEXT,
  content             TEXT                                            NOT NULL,
  rating              TINYINT CHECK (rating BETWEEN 1 AND 5),
  source              ENUM('form','csv_import','manual','api')        NOT NULL DEFAULT 'form',
  status              ENUM('pending','approved','rejected')           NOT NULL DEFAULT 'pending',
  is_featured         TINYINT(1)                                      NOT NULL DEFAULT 0,
  tags                JSON,                                           -- array of tag strings
  submitted_at        TIMESTAMP                                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at         TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_testimonials_workspace FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_testimonials_form FOREIGN KEY (form_id)
    REFERENCES collection_forms (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- invitations: invite team members to a workspace
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id            CHAR(36)                      NOT NULL DEFAULT (UUID()),
  workspace_id  CHAR(36)                      NOT NULL,
  email         VARCHAR(255)                  NOT NULL,
  role          ENUM('admin','viewer')        NOT NULL DEFAULT 'viewer',
  token         VARCHAR(255)                  NOT NULL,
  expires_at    TIMESTAMP                     NOT NULL,
  accepted_at   TIMESTAMP,
  created_at    TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invitation_token (token),
  CONSTRAINT fk_invitations_workspace FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- integrations: Third-party integrations (Google, Facebook, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS integrations (
  id                CHAR(36)                      NOT NULL DEFAULT (UUID()),
  workspace_id      CHAR(36)                      NOT NULL,
  platform          ENUM('google','facebook','instagram') NOT NULL,
  access_token      TEXT,
  refresh_token     TEXT,
  external_account_id VARCHAR(255),
  external_account_name VARCHAR(255),
  metadata          JSON,
  created_at        TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ws_platform (workspace_id, platform),
  CONSTRAINT fk_integrations_workspace FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- widgets: customized embed configurations
-- ============================================================
CREATE TABLE IF NOT EXISTS widgets (
  id            CHAR(36)                      NOT NULL DEFAULT (UUID()),
  workspace_id  CHAR(36)                      NOT NULL,
  name          VARCHAR(255)                  NOT NULL,
  config        JSON                          NOT NULL, -- { theme, layout, colors, font, templates, etc. }
  created_at    TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_widgets_workspace FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

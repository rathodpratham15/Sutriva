import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  repository_root TEXT,
  repository_branch TEXT,
  repository_commit TEXT,
  sources_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS temporal_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ts_start REAL NOT NULL,
  ts_end REAL NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL,
  source_kind TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  related_event_ids_json TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_events_session_ts ON temporal_events(session_id, ts_start);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES temporal_events(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  ts_start REAL NOT NULL,
  ts_end REAL NOT NULL,
  description TEXT NOT NULL,
  confidence REAL NOT NULL,
  source_kind TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  artifact_id TEXT,
  related_evidence_ids_json TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_evidence_session_ts ON evidence(session_id, ts_start);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  ts_start REAL,
  ts_end REAL,
  content_hash TEXT,
  mime_type TEXT,
  metadata_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_artifacts_session ON artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_hash ON artifacts(content_hash);

CREATE TABLE IF NOT EXISTS transcript_segments (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ts_start REAL NOT NULL,
  ts_end REAL NOT NULL,
  text TEXT NOT NULL,
  confidence REAL
);
CREATE INDEX IF NOT EXISTS idx_transcript_session_ts ON transcript_segments(session_id, ts_start);

CREATE TABLE IF NOT EXISTS video_sessions (
  content_hash TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
);
`;

export type SutrivaDb = Database.Database;

export function openDatabase(dbPath: string): SutrivaDb {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

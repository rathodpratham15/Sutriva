import type { Artifact, ArtifactKind, Evidence, Session, TemporalEvent, TranscriptSegment } from "@sutriva/core";
import { sessionNotFoundError } from "@sutriva/core";
import { openDatabase, type SutrivaDb } from "./db.js";

interface SessionRow {
  id: string;
  mode: string;
  started_at: string;
  ended_at: string | null;
  repository_root: string | null;
  repository_branch: string | null;
  repository_commit: string | null;
  sources_json: string;
}

interface EventRow {
  id: string;
  session_id: string;
  ts_start: number;
  ts_end: number;
  type: string;
  description: string;
  confidence: number | null;
  source_kind: string;
  source_reference: string;
  related_event_ids_json: string;
}

interface EvidenceRow {
  id: string;
  event_id: string | null;
  session_id: string;
  type: string;
  ts_start: number;
  ts_end: number;
  description: string;
  confidence: number;
  source_kind: string;
  source_reference: string;
  artifact_id: string | null;
  related_evidence_ids_json: string;
}

interface ArtifactRow {
  id: string;
  session_id: string;
  kind: string;
  path: string;
  ts_start: number | null;
  ts_end: number | null;
  content_hash: string | null;
  mime_type: string | null;
  metadata_json: string | null;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    mode: row.mode as Session["mode"],
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    repository: row.repository_root
      ? { root: row.repository_root, branch: row.repository_branch ?? undefined, commit: row.repository_commit ?? undefined }
      : undefined,
    sources: JSON.parse(row.sources_json),
  };
}

function rowToEvent(row: EventRow): TemporalEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    timestamp: { start: row.ts_start, end: row.ts_end },
    type: row.type as TemporalEvent["type"],
    description: row.description,
    confidence: row.confidence ?? undefined,
    source: { kind: row.source_kind, reference: row.source_reference },
    relatedEventIds: JSON.parse(row.related_event_ids_json),
  };
}

function rowToEvidence(row: EvidenceRow): Evidence {
  return {
    id: row.id,
    eventId: row.event_id ?? undefined,
    type: row.type,
    timestamp: { start: row.ts_start, end: row.ts_end },
    description: row.description,
    confidence: row.confidence,
    source: { kind: row.source_kind, reference: row.source_reference },
    artifactId: row.artifact_id ?? undefined,
    relatedEvidenceIds: JSON.parse(row.related_evidence_ids_json),
  };
}

function rowToArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    sessionId: row.session_id,
    kind: row.kind as ArtifactKind,
    path: row.path,
    timestamp: row.ts_start !== null && row.ts_end !== null ? { start: row.ts_start, end: row.ts_end } : undefined,
    contentHash: row.content_hash ?? undefined,
    mimeType: row.mime_type ?? undefined,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
  };
}

export class SutrivaStore {
  readonly db: SutrivaDb;

  constructor(dbPath: string) {
    this.db = openDatabase(dbPath);
  }

  close(): void {
    this.db.close();
  }

  // --- Sessions -------------------------------------------------------

  createSession(session: Session): void {
    this.db
      .prepare(
        `INSERT INTO sessions (id, mode, started_at, ended_at, repository_root, repository_branch, repository_commit, sources_json)
         VALUES (@id, @mode, @startedAt, @endedAt, @repoRoot, @repoBranch, @repoCommit, @sourcesJson)`,
      )
      .run({
        id: session.id,
        mode: session.mode,
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? null,
        repoRoot: session.repository?.root ?? null,
        repoBranch: session.repository?.branch ?? null,
        repoCommit: session.repository?.commit ?? null,
        sourcesJson: JSON.stringify(session.sources),
      });
  }

  getSession(id: string): Session {
    const row = this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionRow | undefined;
    if (!row) throw sessionNotFoundError(id);
    return rowToSession(row);
  }

  findSession(id: string): Session | undefined {
    const row = this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionRow | undefined;
    return row ? rowToSession(row) : undefined;
  }

  listSessions(): Session[] {
    const rows = this.db.prepare("SELECT * FROM sessions ORDER BY started_at DESC").all() as SessionRow[];
    return rows.map(rowToSession);
  }

  endSession(id: string, endedAt: string): void {
    this.db.prepare("UPDATE sessions SET ended_at = ? WHERE id = ?").run(endedAt, id);
  }

  /** The most recently started live session that hasn't been ended -- lets get_current_context auto-discover it without a sessionId. */
  findActiveLiveSession(): Session | undefined {
    const row = this.db
      .prepare("SELECT * FROM sessions WHERE mode = 'live' AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1")
      .get() as SessionRow | undefined;
    return row ? rowToSession(row) : undefined;
  }

  /** Deletes a session and cascades to its events/evidence/artifacts/transcript rows. */
  deleteSession(id: string): void {
    this.db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  }

  /** Video sessions are keyed by content hash so re-inspecting the same file reuses the session. */
  findSessionIdByContentHash(hash: string): string | undefined {
    const row = this.db.prepare("SELECT session_id FROM video_sessions WHERE content_hash = ?").get(hash) as
      | { session_id: string }
      | undefined;
    return row?.session_id;
  }

  linkContentHashToSession(hash: string, sessionId: string): void {
    this.db
      .prepare("INSERT OR REPLACE INTO video_sessions (content_hash, session_id) VALUES (?, ?)")
      .run(hash, sessionId);
  }

  // --- Events -----------------------------------------------------------

  insertEvent(event: TemporalEvent): void {
    this.db
      .prepare(
        `INSERT INTO temporal_events (id, session_id, ts_start, ts_end, type, description, confidence, source_kind, source_reference, related_event_ids_json)
         VALUES (@id, @sessionId, @tsStart, @tsEnd, @type, @description, @confidence, @sourceKind, @sourceReference, @relatedEventIdsJson)`,
      )
      .run({
        id: event.id,
        sessionId: event.sessionId,
        tsStart: event.timestamp.start,
        tsEnd: event.timestamp.end,
        type: event.type,
        description: event.description,
        confidence: event.confidence ?? null,
        sourceKind: event.source.kind,
        sourceReference: event.source.reference,
        relatedEventIdsJson: JSON.stringify(event.relatedEventIds),
      });
  }

  insertEvents(events: TemporalEvent[]): void {
    const tx = this.db.transaction((items: TemporalEvent[]) => {
      for (const event of items) this.insertEvent(event);
    });
    tx(events);
  }

  listEvents(sessionId: string, options: { afterSeconds?: number; beforeSeconds?: number; limit?: number } = {}): TemporalEvent[] {
    let sql = "SELECT * FROM temporal_events WHERE session_id = ?";
    const params: unknown[] = [sessionId];
    if (options.afterSeconds !== undefined) {
      sql += " AND ts_start >= ?";
      params.push(options.afterSeconds);
    }
    if (options.beforeSeconds !== undefined) {
      sql += " AND ts_start <= ?";
      params.push(options.beforeSeconds);
    }
    sql += " ORDER BY ts_start ASC";
    if (options.limit) {
      sql += " LIMIT ?";
      params.push(options.limit);
    }
    const rows = this.db.prepare(sql).all(...params) as EventRow[];
    return rows.map(rowToEvent);
  }

  /** The most recent `limit` events, in chronological order -- for a live session's "what just happened" view. */
  listRecentEvents(sessionId: string, limit: number): TemporalEvent[] {
    const rows = this.db
      .prepare("SELECT * FROM temporal_events WHERE session_id = ? ORDER BY ts_start DESC LIMIT ?")
      .all(sessionId, limit) as EventRow[];
    return rows.map(rowToEvent).reverse();
  }

  searchEvents(sessionId: string, query: string): TemporalEvent[] {
    const rows = this.db
      .prepare("SELECT * FROM temporal_events WHERE session_id = ? AND description LIKE ? ORDER BY ts_start ASC")
      .all(sessionId, `%${query}%`) as EventRow[];
    return rows.map(rowToEvent);
  }

  // --- Evidence -----------------------------------------------------------

  insertEvidence(evidence: Evidence & { sessionId: string }): void {
    this.db
      .prepare(
        `INSERT INTO evidence (id, event_id, session_id, type, ts_start, ts_end, description, confidence, source_kind, source_reference, artifact_id, related_evidence_ids_json)
         VALUES (@id, @eventId, @sessionId, @type, @tsStart, @tsEnd, @description, @confidence, @sourceKind, @sourceReference, @artifactId, @relatedEvidenceIdsJson)`,
      )
      .run({
        id: evidence.id,
        eventId: evidence.eventId ?? null,
        sessionId: evidence.sessionId,
        type: evidence.type,
        tsStart: evidence.timestamp.start,
        tsEnd: evidence.timestamp.end,
        description: evidence.description,
        confidence: evidence.confidence,
        sourceKind: evidence.source.kind,
        sourceReference: evidence.source.reference,
        artifactId: evidence.artifactId ?? null,
        relatedEvidenceIdsJson: JSON.stringify(evidence.relatedEvidenceIds),
      });
  }

  insertEvidenceBatch(items: (Evidence & { sessionId: string })[]): void {
    const tx = this.db.transaction((batch: (Evidence & { sessionId: string })[]) => {
      for (const item of batch) this.insertEvidence(item);
    });
    tx(items);
  }

  getEvidenceAround(sessionId: string, aroundSeconds: number, windowSeconds: number): Evidence[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM evidence WHERE session_id = ? AND ts_start >= ? AND ts_start <= ? ORDER BY ts_start ASC`,
      )
      .all(sessionId, aroundSeconds - windowSeconds, aroundSeconds + windowSeconds) as EvidenceRow[];
    return rows.map(rowToEvidence);
  }

  listEvidence(sessionId: string): Evidence[] {
    const rows = this.db.prepare("SELECT * FROM evidence WHERE session_id = ? ORDER BY ts_start ASC").all(sessionId) as EvidenceRow[];
    return rows.map(rowToEvidence);
  }

  // --- Artifacts -----------------------------------------------------------

  insertArtifact(artifact: Artifact): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO artifacts (id, session_id, kind, path, ts_start, ts_end, content_hash, mime_type, metadata_json)
         VALUES (@id, @sessionId, @kind, @path, @tsStart, @tsEnd, @contentHash, @mimeType, @metadataJson)`,
      )
      .run({
        id: artifact.id,
        sessionId: artifact.sessionId,
        kind: artifact.kind,
        path: artifact.path,
        tsStart: artifact.timestamp?.start ?? null,
        tsEnd: artifact.timestamp?.end ?? null,
        contentHash: artifact.contentHash ?? null,
        mimeType: artifact.mimeType ?? null,
        metadataJson: artifact.metadata ? JSON.stringify(artifact.metadata) : null,
      });
  }

  getArtifact(id: string): Artifact | undefined {
    const row = this.db.prepare("SELECT * FROM artifacts WHERE id = ?").get(id) as ArtifactRow | undefined;
    return row ? rowToArtifact(row) : undefined;
  }

  findArtifactNearTimestamp(sessionId: string, kind: string, timestamp: number): Artifact | undefined {
    const row = this.db
      .prepare(
        `SELECT * FROM artifacts WHERE session_id = ? AND kind = ?
         ORDER BY ABS(ts_start - ?) ASC LIMIT 1`,
      )
      .get(sessionId, kind, timestamp) as ArtifactRow | undefined;
    return row ? rowToArtifact(row) : undefined;
  }

  /** The most recently captured artifact of a kind -- e.g. the latest live screenshot for get_current_context. */
  getLatestArtifact(sessionId: string, kind: string): Artifact | undefined {
    const row = this.db
      .prepare("SELECT * FROM artifacts WHERE session_id = ? AND kind = ? ORDER BY ts_start DESC LIMIT 1")
      .get(sessionId, kind) as ArtifactRow | undefined;
    return row ? rowToArtifact(row) : undefined;
  }

  // --- Transcript -----------------------------------------------------------

  insertTranscriptSegments(segments: TranscriptSegment[]): void {
    const tx = this.db.transaction((items: TranscriptSegment[]) => {
      const stmt = this.db.prepare(
        `INSERT INTO transcript_segments (id, session_id, ts_start, ts_end, text, confidence) VALUES (@id, @sessionId, @tsStart, @tsEnd, @text, @confidence)`,
      );
      for (const seg of items) {
        stmt.run({
          id: seg.id,
          sessionId: seg.sessionId,
          tsStart: seg.timestamp.start,
          tsEnd: seg.timestamp.end,
          text: seg.text,
          confidence: seg.confidence ?? null,
        });
      }
    });
    tx(segments);
  }

  listTranscriptSegments(sessionId: string): TranscriptSegment[] {
    const rows = this.db
      .prepare("SELECT * FROM transcript_segments WHERE session_id = ? ORDER BY ts_start ASC")
      .all(sessionId) as { id: string; session_id: string; ts_start: number; ts_end: number; text: string; confidence: number | null }[];
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      timestamp: { start: r.ts_start, end: r.ts_end },
      text: r.text,
      confidence: r.confidence ?? undefined,
    }));
  }
}

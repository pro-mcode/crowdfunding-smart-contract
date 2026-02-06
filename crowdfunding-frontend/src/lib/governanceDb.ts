import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "governance.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

const ensureColumn = (table: string, column: string, definition: string) => {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as { name: string }[];
  const hasColumn = columns.some((item) => item.name === column);
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

const init = () => {
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      track TEXT NOT NULL,
      summary TEXT NOT NULL,
      proposer TEXT,
      proposerAddress TEXT,
      proposerHandle TEXT,
      requestedEth REAL NOT NULL,
      status TEXT NOT NULL,
      submittedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      proposalId TEXT NOT NULL,
      voter TEXT NOT NULL,
      choice TEXT NOT NULL,
      weight REAL NOT NULL,
      timestamp TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS unlocks (
      id TEXT PRIMARY KEY,
      milestoneTitle TEXT NOT NULL,
      amountEth REAL NOT NULL,
      proposalId TEXT,
      proofHash TEXT,
      dueDate TEXT,
      status TEXT NOT NULL,
      releasedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor TEXT,
      targetId TEXT,
      createdAt TEXT NOT NULL,
      meta TEXT
    );
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      recipient TEXT NOT NULL,
      badge TEXT NOT NULL,
      tokenId TEXT NOT NULL,
      issuedAt TEXT NOT NULL,
      expiresAt TEXT
    );
    CREATE TABLE IF NOT EXISTS badge_archive (
      id TEXT PRIMARY KEY,
      recipient TEXT NOT NULL,
      badge TEXT NOT NULL,
      tokenId TEXT NOT NULL,
      issuedAt TEXT NOT NULL,
      expiresAt TEXT,
      archivedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS badge_registry (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      weight REAL NOT NULL,
      renewDays INTEGER,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      contentHtml TEXT NOT NULL,
      tags TEXT NOT NULL,
      coverUrl TEXT,
      galleryUrls TEXT,
      fileUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS article_versions (
      id TEXT PRIMARY KEY,
      articleId TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      contentHtml TEXT NOT NULL,
      tags TEXT NOT NULL,
      coverUrl TEXT,
      galleryUrls TEXT,
      fileUrl TEXT,
      versionedAt TEXT NOT NULL
    );
  `);

  ensureColumn("proposals", "proposer", "TEXT");
  ensureColumn("proposals", "proposerAddress", "TEXT");
  ensureColumn("proposals", "proposerHandle", "TEXT");
  ensureColumn("unlocks", "proposalId", "TEXT");
  ensureColumn("badges", "expiresAt", "TEXT");
  ensureColumn("articles", "galleryUrls", "TEXT");
  ensureColumn("badge_registry", "renewDays", "INTEGER");
};

init();

export type ProposalRow = {
  id: string;
  title: string;
  track: string;
  summary: string;
  proposer: string | null;
  proposerAddress: string | null;
  proposerHandle: string | null;
  requestedEth: number;
  status: string;
  submittedAt: string;
};

export type VoteRow = {
  id: string;
  proposalId: string;
  voter: string;
  choice: string;
  weight: number;
  timestamp: string;
};

export type UnlockRow = {
  id: string;
  milestoneTitle: string;
  amountEth: number;
  proposalId: string | null;
  proofHash: string | null;
  dueDate: string | null;
  status: string;
  releasedAt: string | null;
};

export const listAll = () => {
  const proposals = db
    .prepare("SELECT * FROM proposals ORDER BY submittedAt DESC")
    .all() as ProposalRow[];
  const votes = db
    .prepare("SELECT * FROM votes ORDER BY timestamp DESC")
    .all() as VoteRow[];
  const unlocks = db
    .prepare("SELECT * FROM unlocks ORDER BY dueDate DESC")
    .all() as UnlockRow[];
  return { proposals, votes, unlocks };
};

export type BadgeRow = {
  id: string;
  recipient: string;
  badge: string;
  tokenId: string;
  issuedAt: string;
  expiresAt: string | null;
};

export type BadgeArchiveRow = {
  id: string;
  recipient: string;
  badge: string;
  tokenId: string;
  issuedAt: string;
  expiresAt: string | null;
  archivedAt: string;
};

export type BadgeRegistryRow = {
  id: string;
  title: string;
  code: string;
  weight: number;
  renewDays: number | null;
  createdAt: string;
};

export const listBadgeRegistry = () => {
  return db
    .prepare("SELECT * FROM badge_registry ORDER BY createdAt DESC")
    .all() as BadgeRegistryRow[];
};

export const createBadgeRegistry = (entry: BadgeRegistryRow) => {
  db.prepare(
    `INSERT INTO badge_registry (id, title, code, weight, renewDays, createdAt)
     VALUES (@id, @title, @code, @weight, @renewDays, @createdAt)`
  ).run(entry);
};

export const deleteBadgeRegistry = (id: string) => {
  db.prepare("DELETE FROM badge_registry WHERE id = ?").run(id);
};

export const listBadges = () => {
  return db
    .prepare("SELECT * FROM badges ORDER BY issuedAt DESC")
    .all() as BadgeRow[];
};

export const listBadgeArchive = () => {
  return db
    .prepare("SELECT * FROM badge_archive ORDER BY archivedAt DESC")
    .all() as BadgeArchiveRow[];
};

export const createBadge = (badge: BadgeRow) => {
  db.prepare(
    `INSERT INTO badges (id, recipient, badge, tokenId, issuedAt, expiresAt)
     VALUES (@id, @recipient, @badge, @tokenId, @issuedAt, @expiresAt)`
  ).run(badge);
};

export const deleteBadge = (id: string) => {
  db.prepare("DELETE FROM badges WHERE id = ?").run(id);
};

export const archiveExpiredBadges = () => {
  const registry = listBadgeRegistry();
  const renewMap = new Map(
    registry.map((entry) => [entry.title.toLowerCase(), entry.renewDays ?? 0])
  );
  const expired = db
    .prepare(
      "SELECT * FROM badges WHERE expiresAt IS NOT NULL AND datetime(expiresAt) <= datetime('now')"
    )
    .all() as BadgeRow[];
  if (expired.length === 0) return { archived: 0, renewed: 0 };
  const insert = db.prepare(
    `INSERT INTO badge_archive (id, recipient, badge, tokenId, issuedAt, expiresAt, archivedAt)
     VALUES (@id, @recipient, @badge, @tokenId, @issuedAt, @expiresAt, @archivedAt)`
  );
  const remove = db.prepare("DELETE FROM badges WHERE id = ?");
  const renew = db.prepare("UPDATE badges SET expiresAt = ? WHERE id = ?");
  const archivedAt = new Date().toISOString();
  let archivedCount = 0;
  let renewedCount = 0;
  const tx = db.transaction(() => {
    expired.forEach((badge) => {
      const renewDays = renewMap.get(badge.badge.toLowerCase()) ?? 0;
      if (renewDays > 0) {
        const next = new Date();
        next.setDate(next.getDate() + renewDays);
        renew.run(next.toISOString(), badge.id);
        renewedCount += 1;
      } else {
        insert.run({ ...badge, archivedAt });
        remove.run(badge.id);
        archivedCount += 1;
      }
    });
  });
  tx();
  return { archived: archivedCount, renewed: renewedCount };
};

export type ArticleRow = {
  id: string;
  title: string;
  summary: string;
  contentHtml: string;
  tags: string;
  coverUrl: string | null;
  galleryUrls: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export const listArticles = () => {
  return db
    .prepare("SELECT * FROM articles ORDER BY createdAt DESC")
    .all() as ArticleRow[];
};

export const getArticleById = (id: string) => {
  return db
    .prepare("SELECT * FROM articles WHERE id = ?")
    .get(id) as ArticleRow | undefined;
};

export const createArticle = (article: ArticleRow) => {
  db.prepare(
    `INSERT INTO articles (id, title, summary, contentHtml, tags, coverUrl, galleryUrls, fileUrl, createdAt, updatedAt)
     VALUES (@id, @title, @summary, @contentHtml, @tags, @coverUrl, @galleryUrls, @fileUrl, @createdAt, @updatedAt)`
  ).run(article);
};

export const updateArticle = (
  id: string,
  updates: Partial<Omit<ArticleRow, "id" | "createdAt">>
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    fields.push(`${key} = ?`);
    values.push(value);
  });
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE articles SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
};

export const deleteArticle = (id: string) => {
  db.prepare("DELETE FROM articles WHERE id = ?").run(id);
};

export type ArticleVersionRow = {
  id: string;
  articleId: string;
  title: string;
  summary: string;
  contentHtml: string;
  tags: string;
  coverUrl: string | null;
  galleryUrls: string | null;
  fileUrl: string | null;
  versionedAt: string;
};

export const listArticleVersions = (articleId: string) => {
  return db
    .prepare(
      "SELECT * FROM article_versions WHERE articleId = ? ORDER BY versionedAt DESC"
    )
    .all(articleId) as ArticleVersionRow[];
};

export const createArticleVersion = (version: ArticleVersionRow) => {
  db.prepare(
    `INSERT INTO article_versions (id, articleId, title, summary, contentHtml, tags, coverUrl, galleryUrls, fileUrl, versionedAt)
     VALUES (@id, @articleId, @title, @summary, @contentHtml, @tags, @coverUrl, @galleryUrls, @fileUrl, @versionedAt)`
  ).run(version);
};

export const getProposalById = (id: string) => {
  return db
    .prepare("SELECT * FROM proposals WHERE id = ?")
    .get(id) as ProposalRow | undefined;
};

export const createProposal = (proposal: ProposalRow) => {
  db.prepare(
    `INSERT INTO proposals (id, title, track, summary, proposer, proposerAddress, proposerHandle, requestedEth, status, submittedAt)
     VALUES (@id, @title, @track, @summary, @proposer, @proposerAddress, @proposerHandle, @requestedEth, @status, @submittedAt)`
  ).run(proposal);
};

export const updateProposal = (
  id: string,
  updates: Partial<Omit<ProposalRow, "id" | "submittedAt">>
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    fields.push(`${key} = ?`);
    values.push(value);
  });
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE proposals SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
};

export const logAudit = (
  action: string,
  actor: string | null,
  targetId: string | null,
  meta?: Record<string, unknown>
) => {
  db.prepare(
    `INSERT INTO audits (id, action, actor, targetId, createdAt, meta)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    crypto.randomUUID(),
    action,
    actor,
    targetId,
    new Date().toISOString(),
    meta ? JSON.stringify(meta) : null
  );
};

export const deleteProposal = (id: string) => {
  db.prepare("DELETE FROM proposals WHERE id = ?").run(id);
  db.prepare("DELETE FROM votes WHERE proposalId = ?").run(id);
};

export const createVote = (vote: VoteRow) => {
  db.prepare(
    `INSERT INTO votes (id, proposalId, voter, choice, weight, timestamp)
     VALUES (@id, @proposalId, @voter, @choice, @weight, @timestamp)`
  ).run(vote);
};

export const deleteVote = (id: string) => {
  db.prepare("DELETE FROM votes WHERE id = ?").run(id);
};

export const createUnlock = (unlock: UnlockRow) => {
  db.prepare(
    `INSERT INTO unlocks (id, milestoneTitle, amountEth, proposalId, proofHash, dueDate, status, releasedAt)
     VALUES (@id, @milestoneTitle, @amountEth, @proposalId, @proofHash, @dueDate, @status, @releasedAt)`
  ).run(unlock);
};

export const releaseUnlock = (id: string, releasedAt: string) => {
  db.prepare(
    "UPDATE unlocks SET status = 'Released', releasedAt = ? WHERE id = ?"
  ).run(releasedAt, id);
};

export const deleteUnlock = (id: string) => {
  db.prepare("DELETE FROM unlocks WHERE id = ?").run(id);
};

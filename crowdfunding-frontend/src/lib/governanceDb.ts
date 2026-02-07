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
      expiresAt TEXT,
      meta TEXT
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
    CREATE TABLE IF NOT EXISTS vault_registry (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      focus TEXT NOT NULL,
      tvl TEXT NOT NULL,
      activeProposals INTEGER NOT NULL,
      riskRating TEXT NOT NULL,
      participation TEXT NOT NULL,
      horizon TEXT NOT NULL,
      overview TEXT NOT NULL,
      thesis TEXT NOT NULL,
      expectedOutcomes TEXT NOT NULL,
      fundingStructure TEXT NOT NULL,
      withdrawalConditions TEXT NOT NULL,
      governanceModel TEXT NOT NULL,
      deliverables TEXT NOT NULL,
      reports TEXT NOT NULL,
      datasets TEXT NOT NULL,
      ipRights TEXT NOT NULL,
      activity TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS learn_registry (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS identity_links (
      id TEXT PRIMARY KEY,
      walletAddress TEXT NOT NULL,
      githubHandle TEXT NOT NULL,
      gistUrl TEXT NOT NULL,
      signature TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      verifiedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY,
      walletAddress TEXT NOT NULL,
      source TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL,
      points REAL NOT NULL,
      evidence TEXT,
      occurredAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      metadata TEXT,
      status TEXT NOT NULL,
      verifiedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS badge_snapshots (
      id TEXT PRIMARY KEY,
      period TEXT NOT NULL,
      periodStart TEXT NOT NULL,
      periodEnd TEXT NOT NULL,
      rubricVersion TEXT NOT NULL,
      thresholds TEXT,
      generatedAt TEXT NOT NULL,
      snapshotHash TEXT NOT NULL,
      totalContributors INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS badge_awards (
      id TEXT PRIMARY KEY,
      snapshotId TEXT NOT NULL,
      walletAddress TEXT NOT NULL,
      badgeTitle TEXT NOT NULL,
      points REAL NOT NULL,
      issued INTEGER NOT NULL,
      issuedAt TEXT,
      badgeId TEXT
    );
  `);

  ensureColumn("proposals", "proposer", "TEXT");
  ensureColumn("proposals", "proposerAddress", "TEXT");
  ensureColumn("proposals", "proposerHandle", "TEXT");
  ensureColumn("unlocks", "proposalId", "TEXT");
  ensureColumn("badges", "expiresAt", "TEXT");
  ensureColumn("badges", "meta", "TEXT");
  ensureColumn("articles", "galleryUrls", "TEXT");
  ensureColumn("badge_registry", "renewDays", "INTEGER");
  ensureColumn("contributions", "status", "TEXT");
  ensureColumn("contributions", "verifiedAt", "TEXT");
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
  meta?: string | null;
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
  const payload = { ...badge, meta: badge.meta ?? null };
  db.prepare(
    `INSERT INTO badges (id, recipient, badge, tokenId, issuedAt, expiresAt, meta)
     VALUES (@id, @recipient, @badge, @tokenId, @issuedAt, @expiresAt, @meta)`
  ).run(payload);
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

const allowedArticleUpdateFields = new Set([
  "title",
  "summary",
  "contentHtml",
  "tags",
  "coverUrl",
  "galleryUrls",
  "fileUrl",
  "updatedAt",
]);

export const updateArticle = (
  id: string,
  updates: Partial<Omit<ArticleRow, "id" | "createdAt">>
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    if (!allowedArticleUpdateFields.has(key)) return;
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

export type VaultRegistryRow = {
  id: string;
  name: string;
  focus: string;
  tvl: string;
  activeProposals: number;
  riskRating: string;
  participation: string;
  horizon: string;
  overview: string;
  thesis: string;
  expectedOutcomes: string;
  fundingStructure: string;
  withdrawalConditions: string;
  governanceModel: string;
  deliverables: string;
  reports: string;
  datasets: string;
  ipRights: string;
  activity: string;
  createdAt: string;
  updatedAt: string;
};

export const listVaultRegistry = () => {
  return db
    .prepare("SELECT * FROM vault_registry ORDER BY updatedAt DESC")
    .all() as VaultRegistryRow[];
};

export const getVaultRegistryById = (id: string) => {
  return db
    .prepare("SELECT * FROM vault_registry WHERE id = ?")
    .get(id) as VaultRegistryRow | undefined;
};

export const createVaultRegistry = (entry: VaultRegistryRow) => {
  db.prepare(
    `INSERT INTO vault_registry (
      id, name, focus, tvl, activeProposals, riskRating, participation, horizon,
      overview, thesis, expectedOutcomes, fundingStructure, withdrawalConditions,
      governanceModel, deliverables, reports, datasets, ipRights, activity,
      createdAt, updatedAt
    )
    VALUES (
      @id, @name, @focus, @tvl, @activeProposals, @riskRating, @participation, @horizon,
      @overview, @thesis, @expectedOutcomes, @fundingStructure, @withdrawalConditions,
      @governanceModel, @deliverables, @reports, @datasets, @ipRights, @activity,
      @createdAt, @updatedAt
    )`
  ).run(entry);
};

const allowedVaultUpdateFields = new Set([
  "name",
  "focus",
  "tvl",
  "activeProposals",
  "riskRating",
  "participation",
  "horizon",
  "overview",
  "thesis",
  "expectedOutcomes",
  "fundingStructure",
  "withdrawalConditions",
  "governanceModel",
  "deliverables",
  "reports",
  "datasets",
  "ipRights",
  "activity",
  "updatedAt",
]);

export const updateVaultRegistry = (
  id: string,
  updates: Partial<Omit<VaultRegistryRow, "id" | "createdAt">>
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    if (!allowedVaultUpdateFields.has(key)) return;
    fields.push(`${key} = ?`);
    values.push(value);
  });
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE vault_registry SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
};

export const deleteVaultRegistry = (id: string) => {
  db.prepare("DELETE FROM vault_registry WHERE id = ?").run(id);
};

export type LearnRegistryRow = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export const listLearnRegistry = () => {
  return db
    .prepare("SELECT * FROM learn_registry ORDER BY updatedAt DESC")
    .all() as LearnRegistryRow[];
};

export const getLearnRegistryById = (id: string) => {
  return db
    .prepare("SELECT * FROM learn_registry WHERE id = ?")
    .get(id) as LearnRegistryRow | undefined;
};

export const createLearnRegistry = (entry: LearnRegistryRow) => {
  db.prepare(
    `INSERT INTO learn_registry (id, title, description, createdAt, updatedAt)
     VALUES (@id, @title, @description, @createdAt, @updatedAt)`
  ).run(entry);
};

const allowedLearnUpdateFields = new Set(["title", "description", "updatedAt"]);

export const updateLearnRegistry = (
  id: string,
  updates: Partial<Omit<LearnRegistryRow, "id" | "createdAt">>
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    if (!allowedLearnUpdateFields.has(key)) return;
    fields.push(`${key} = ?`);
    values.push(value);
  });
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE learn_registry SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
};

export const deleteLearnRegistry = (id: string) => {
  db.prepare("DELETE FROM learn_registry WHERE id = ?").run(id);
};

export type IdentityLinkRow = {
  id: string;
  walletAddress: string;
  githubHandle: string;
  gistUrl: string;
  signature: string;
  message: string;
  createdAt: string;
  verifiedAt: string;
};

export const listIdentityLinks = () => {
  return db
    .prepare("SELECT * FROM identity_links ORDER BY verifiedAt DESC")
    .all() as IdentityLinkRow[];
};

export const createIdentityLink = (link: IdentityLinkRow) => {
  db.prepare(
    `INSERT INTO identity_links (id, walletAddress, githubHandle, gistUrl, signature, message, createdAt, verifiedAt)
     VALUES (@id, @walletAddress, @githubHandle, @gistUrl, @signature, @message, @createdAt, @verifiedAt)`
  ).run(link);
};

export type ContributionRow = {
  id: string;
  walletAddress: string;
  source: string;
  type: string;
  quantity: number | null;
  points: number;
  evidence: string | null;
  occurredAt: string;
  createdAt: string;
  metadata: string | null;
  status: string;
  verifiedAt: string | null;
};

export const createContribution = (
  entry: Omit<ContributionRow, "status" | "verifiedAt"> & {
    status?: string;
    verifiedAt?: string | null;
  }
) => {
  const status = entry.status ?? "verified";
  const verifiedAt = status === "verified" ? entry.verifiedAt ?? entry.createdAt : null;
  const payload = { ...entry, status, verifiedAt };
  db.prepare(
    `INSERT INTO contributions (id, walletAddress, source, type, quantity, points, evidence, occurredAt, createdAt, metadata, status, verifiedAt)
     VALUES (@id, @walletAddress, @source, @type, @quantity, @points, @evidence, @occurredAt, @createdAt, @metadata, @status, @verifiedAt)`
  ).run(payload);
};

export const listContributions = () => {
  return db
    .prepare("SELECT * FROM contributions ORDER BY occurredAt DESC")
    .all() as ContributionRow[];
};

export const listContributionsByAddress = (
  walletAddress: string,
  limit = 20
) => {
  return db
    .prepare(
      "SELECT * FROM contributions WHERE walletAddress = ? AND (status = 'verified' OR status IS NULL) ORDER BY occurredAt DESC LIMIT ?"
    )
    .all(walletAddress.toLowerCase(), limit) as ContributionRow[];
};

export const listContributionsByPeriod = (
  startIso: string,
  endIso: string
) => {
  return db
    .prepare(
      `SELECT * FROM contributions
       WHERE (status = 'verified' OR status IS NULL)
       AND datetime(occurredAt) >= datetime(?)
       AND datetime(occurredAt) <= datetime(?)
       ORDER BY occurredAt DESC`
    )
    .all(startIso, endIso) as ContributionRow[];
};

export const findContributionByEvidence = (evidence: string) => {
  return db
    .prepare("SELECT * FROM contributions WHERE evidence = ? LIMIT 1")
    .get(evidence) as ContributionRow | undefined;
};

export const listContributionsByStatus = (
  status: string,
  limit = 100
) => {
  if (status === "verified") {
    return db
      .prepare(
        "SELECT * FROM contributions WHERE status = 'verified' OR status IS NULL ORDER BY occurredAt DESC LIMIT ?"
      )
      .all(limit) as ContributionRow[];
  }
  return db
    .prepare(
      "SELECT * FROM contributions WHERE status = ? ORDER BY occurredAt DESC LIMIT ?"
    )
    .all(status, limit) as ContributionRow[];
};

export const listContributionsByAddressAndStatus = (
  walletAddress: string,
  status: string,
  limit = 50
) => {
  if (status === "verified") {
    return db
      .prepare(
        "SELECT * FROM contributions WHERE walletAddress = ? AND (status = 'verified' OR status IS NULL) ORDER BY occurredAt DESC LIMIT ?"
      )
      .all(walletAddress.toLowerCase(), limit) as ContributionRow[];
  }
  return db
    .prepare(
      "SELECT * FROM contributions WHERE walletAddress = ? AND status = ? ORDER BY occurredAt DESC LIMIT ?"
    )
    .all(walletAddress.toLowerCase(), status, limit) as ContributionRow[];
};

export const updateContributionStatus = (
  id: string,
  status: string,
  points?: number | null
) => {
  const fields: string[] = ["status = ?"];
  const values: unknown[] = [status];
  if (points !== undefined) {
    fields.push("points = ?");
    values.push(points);
  }
  if (status === "verified") {
    fields.push("verifiedAt = ?");
    values.push(new Date().toISOString());
  }
  values.push(id);
  db.prepare(`UPDATE contributions SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
};

export const findIdentityLink = (walletAddress: string, githubHandle: string) => {
  return db
    .prepare(
      "SELECT * FROM identity_links WHERE walletAddress = ? AND githubHandle = ? LIMIT 1"
    )
    .get(walletAddress.toLowerCase(), githubHandle) as IdentityLinkRow | undefined;
};

export const findIdentityLinkByGist = (gistUrl: string) => {
  return db
    .prepare("SELECT * FROM identity_links WHERE gistUrl = ? LIMIT 1")
    .get(gistUrl) as IdentityLinkRow | undefined;
};

export type BadgeSnapshotRow = {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  rubricVersion: string;
  thresholds: string | null;
  generatedAt: string;
  snapshotHash: string;
  totalContributors: number;
  awardsCount?: number;
};

export type BadgeAwardRow = {
  id: string;
  snapshotId: string;
  walletAddress: string;
  badgeTitle: string;
  points: number;
  issued: number;
  issuedAt: string | null;
  badgeId: string | null;
};

export const createBadgeSnapshot = (snapshot: BadgeSnapshotRow) => {
  db.prepare(
    `INSERT INTO badge_snapshots (id, period, periodStart, periodEnd, rubricVersion, thresholds, generatedAt, snapshotHash, totalContributors)
     VALUES (@id, @period, @periodStart, @periodEnd, @rubricVersion, @thresholds, @generatedAt, @snapshotHash, @totalContributors)`
  ).run(snapshot);
};

export const listBadgeSnapshots = () => {
  return db
    .prepare(
      `SELECT s.*,
        (SELECT COUNT(*) FROM badge_awards a WHERE a.snapshotId = s.id) as awardsCount
       FROM badge_snapshots s
       ORDER BY generatedAt DESC`
    )
    .all() as BadgeSnapshotRow[];
};

export const getBadgeSnapshotById = (id: string) => {
  return db
    .prepare(
      `SELECT s.*,
        (SELECT COUNT(*) FROM badge_awards a WHERE a.snapshotId = s.id) as awardsCount
       FROM badge_snapshots s
       WHERE s.id = ?`
    )
    .get(id) as BadgeSnapshotRow | undefined;
};

export const createBadgeAwards = (awards: BadgeAwardRow[]) => {
  const insert = db.prepare(
    `INSERT INTO badge_awards (id, snapshotId, walletAddress, badgeTitle, points, issued, issuedAt, badgeId)
     VALUES (@id, @snapshotId, @walletAddress, @badgeTitle, @points, @issued, @issuedAt, @badgeId)`
  );
  const tx = db.transaction(() => {
    awards.forEach((award) => insert.run(award));
  });
  tx();
};

export const listBadgeAwardsBySnapshot = (snapshotId: string) => {
  return db
    .prepare(
      `SELECT * FROM badge_awards WHERE snapshotId = ? ORDER BY points DESC`
    )
    .all(snapshotId) as BadgeAwardRow[];
};

export const findActiveBadge = (recipient: string, badgeTitle: string) => {
  return db
    .prepare(
      "SELECT * FROM badges WHERE recipient = ? AND badge = ? LIMIT 1"
    )
    .get(recipient, badgeTitle) as BadgeRow | undefined;
};

export const getNextBadgeTokenId = (badgeTitle: string, code: string) => {
  const activeCount = db
    .prepare("SELECT COUNT(*) as count FROM badges WHERE badge = ?")
    .get(badgeTitle) as { count: number };
  const archivedCount = db
    .prepare("SELECT COUNT(*) as count FROM badge_archive WHERE badge = ?")
    .get(badgeTitle) as { count: number };
  const next = (activeCount?.count ?? 0) + (archivedCount?.count ?? 0) + 1;
  return `${code}-${String(next).padStart(3, "0")}`;
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

export const getVoteById = (id: string) => {
  return db
    .prepare("SELECT * FROM votes WHERE id = ?")
    .get(id) as VoteRow | undefined;
};

export const getUnlockById = (id: string) => {
  return db
    .prepare("SELECT * FROM unlocks WHERE id = ?")
    .get(id) as UnlockRow | undefined;
};

export const createProposal = (proposal: ProposalRow) => {
  db.prepare(
    `INSERT INTO proposals (id, title, track, summary, proposer, proposerAddress, proposerHandle, requestedEth, status, submittedAt)
     VALUES (@id, @title, @track, @summary, @proposer, @proposerAddress, @proposerHandle, @requestedEth, @status, @submittedAt)`
  ).run(proposal);
};

const allowedProposalUpdateFields = new Set([
  "title",
  "track",
  "summary",
  "proposer",
  "proposerAddress",
  "proposerHandle",
  "requestedEth",
  "status",
]);

export const updateProposal = (
  id: string,
  updates: Partial<Omit<ProposalRow, "id" | "submittedAt">>
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    if (!allowedProposalUpdateFields.has(key)) return;
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

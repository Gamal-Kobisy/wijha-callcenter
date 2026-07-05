import {ilike} from 'drizzle-orm';
import * as schema from './schema.js';
import { eq, and, desc} from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
// import { db } from './pool.js';
import {
  project,
  user,
  userLog,
  owner,
  numbers,
  ownerInfo,
  callDetailRecord,
  projectCallDetailRecord,
  ownerProject,
} from './schema.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';

// ---------- Inferred row types ----------
type Project = InferSelectModel<typeof project>;
type NewProject = InferInsertModel<typeof project>;

type User = InferSelectModel<typeof user>;
type NewUser = InferInsertModel<typeof user>;

type Owner = InferSelectModel<typeof owner>;
type NewOwner = InferInsertModel<typeof owner>;

type CallDetailRecord = InferSelectModel<typeof callDetailRecord>;
type NewCallDetailRecord = InferInsertModel<typeof callDetailRecord>;

type UserLog = InferSelectModel<typeof userLog>;
type NewUserLog = InferInsertModel<typeof userLog>;

type DB = NodePgDatabase<typeof schema>;

// =========================================================================
// Project
// =========================================================================
export class ProjectRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }
  async create(data: NewProject): Promise<Project> {
    const rows = await this.db.insert(project).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error('Failed to create project');
    return row;
  }

  async findById(id: number): Promise<Project | undefined> {
    const rows = await this.db.select().from(project).where(eq(project.id, id));
    return rows[0];
  }

  async findAll(): Promise<Project[]> {
    return this.db.select().from(project);
  }

  async update(id: number, data: Partial<NewProject>): Promise<Project | undefined> {
    const rows = await this.db
      .update(project)
      .set(data)
      .where(eq(project.id, id))
      .returning();
    return rows[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(project).where(eq(project.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

// =========================================================================
// User
// =========================================================================
export class UserRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }
  async create(data: NewUser): Promise<User> {
    const rows = await this.db.insert(user).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error('Failed to create user');
    return row;
  }

  async findById(id: number): Promise<User | undefined> {
    const rows = await this.db.select().from(user).where(eq(user.id, id));
    return rows[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await this.db.select().from(user).where(ilike(user.email, `%${email}%`));
    return rows[0];
  }

  async findAll(role?: User['role']): Promise<User[]> {
    if (role) {
      return this.db.select().from(user).where(eq(user.role, role));
    }
    return this.db.select().from(user);
  }

  async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
    const rows = await this.db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning();
    return rows[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(user).where(eq(user.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

// =========================================================================
// Owner (+ its numbers & info side tables)
// =========================================================================
export class OwnerRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }
  // Basic owner row only
  async create(data: NewOwner): Promise<Owner> {
    const rows = await this.db.insert(owner).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error('Failed to create owner');
    return row;
  }

  async findById(id: number): Promise<Owner | undefined> {
    const rows = await this.db.select().from(owner).where(eq(owner.id, id));
    return rows[0];
  }

  async findAll(): Promise<Owner[]> {
    return this.db.select().from(owner);
  }

  async update(id: number, data: Partial<NewOwner>): Promise<Owner | undefined> {
    const rows = await this.db
      .update(owner)
      .set(data)
      .where(eq(owner.id, id))
      .returning();
    return rows[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(owner).where(eq(owner.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async findByIdWithDetails(
    id: number
  ): Promise<(Owner & {
    numbers: { number: string | null }[];
    info: { key: string | null; value: string | null }[];
  }) | undefined> {
    const ownerRow = await this.findById(id);
    if (!ownerRow) return undefined;

    const [numberRowsResult, infoRowsResult] = await Promise.all([
      this.db.select().from(numbers).where(eq(numbers.ownerId, id)),
      this.db.select().from(ownerInfo).where(eq(ownerInfo.ownerId, id)),
    ]);
    const numberRows = numberRowsResult || [];
    const infoRows = infoRowsResult || [];

    return {
      ...ownerRow,
      numbers: numberRows.map((n) => ({ number: n.number?.trim() })),
      info: infoRows.map((i) => ({ key: i.key, value: i.value })),
    };
  }

  // Mirrors CreateOwnerRequest: creates owner + numbers + info in one call
  async createWithDetails(input: {
    name: string;
    attemptCount?: number;
    ownerNumbers: string[];
    info?: { key: string; value: string }[];
  }): Promise<Owner> {
    return this.db.transaction(async (tx) => {
      const ownerRows = await tx
        .insert(owner)
        .values({ name: input.name, attemptCount: input.attemptCount })
        .returning();
      const newOwner = ownerRows[0];
      if (!newOwner) throw new Error('Failed to create owner');

      if (input.ownerNumbers.length) {
        await tx.insert(numbers).values(
          input.ownerNumbers.map((n) => ({ number: n, ownerId: newOwner.id }))
        );
      }

      if (input.info?.length) {
        await tx.insert(ownerInfo).values(
          input.info.map((i) => ({ ...i, ownerId: newOwner.id }))
        );
      }

      return newOwner;
    });
  }
}

// =========================================================================
// Call Status (distinct values from call_detail_record)
// =========================================================================
export class CallStatusRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  async findAll(): Promise<string[]> {
    const rows = await this.db
      .select({ status: callDetailRecord.status })
      .from(callDetailRecord)
      .groupBy(callDetailRecord.status);
    return rows.map((r) => r.status).filter((s): s is string => s !== null);
  }
}

// =========================================================================
// Call Detail Record
// =========================================================================
export class CallDetailRecordRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  async create(data: NewCallDetailRecord): Promise<CallDetailRecord> {
    const rows = await this.db.insert(callDetailRecord).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error('Failed to create call detail record');
    return row;
  }

  async findById(id: number): Promise<CallDetailRecord | undefined> {
    const rows = await this.db
      .select()
      .from(callDetailRecord)
      .where(eq(callDetailRecord.id, id));
    return rows[0];
  }

  async findByOwner(ownerId: number): Promise<CallDetailRecord[]> {
    return this.db
      .select()
      .from(callDetailRecord)
      .where(eq(callDetailRecord.ownerId, ownerId))
      .orderBy(desc(callDetailRecord.time));
  }

  async findByAgent(agentId: number): Promise<CallDetailRecord[]> {
    return this.db
      .select()
      .from(callDetailRecord)
      .where(eq(callDetailRecord.agentId, agentId))
      .orderBy(desc(callDetailRecord.time));
  }

  async findAll(): Promise<CallDetailRecord[]> {
    return this.db.select().from(callDetailRecord).orderBy(desc(callDetailRecord.time));
  }

  async update(
    id: number,
    data: Partial<NewCallDetailRecord>
  ): Promise<CallDetailRecord | undefined> {
    const rows = await this.db
      .update(callDetailRecord)
      .set(data)
      .where(eq(callDetailRecord.id, id))
      .returning();
    return rows[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(callDetailRecord).where(eq(callDetailRecord.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Attach a CDR to a project (junction table)
  async linkToProject(projectId: number, callDetailRecordId: number): Promise<void> {
    await this.db.insert(projectCallDetailRecord).values({ projectId, callDetailRecordId });
  }
}

// =========================================================================
// User Log (agent sessions)
// =========================================================================
export class UserLogRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  async create(data: NewUserLog): Promise<UserLog> {
    const rows = await this.db.insert(userLog).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error('Failed to create user log');
    return row;
  }

  async findById(id: number): Promise<UserLog | undefined> {
    const rows = await this.db.select().from(userLog).where(eq(userLog.id, id));
    return rows[0];
  }

  async findByAgent(agentId: number): Promise<UserLog[]> {
    return this.db
      .select()
      .from(userLog)
      .where(eq(userLog.agentId, agentId))
      .orderBy(desc(userLog.startTime));
  }

  async findActiveByAgent(agentId: number): Promise<UserLog | undefined> {
    const rows = await this.db
      .select()
      .from(userLog)
      .where(and(eq(userLog.agentId, agentId), eq(userLog.isActive, true)));
    return rows[0];
  }

  async update(id: number, data: Partial<NewUserLog>): Promise<UserLog | undefined> {
    const rows = await this.db
      .update(userLog)
      .set(data)
      .where(eq(userLog.id, id))
      .returning();
    return rows[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(userLog).where(eq(userLog.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

// =========================================================================
// Owner <-> Project (junction table)
// =========================================================================
export class OwnerProjectRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  async link(ownerId: number, projectId: number): Promise<void> {
    await this.db.insert(ownerProject).values({ ownerId, projectId });
  }

  async unlink(ownerId: number, projectId: number): Promise<void> {
    await this.db
      .delete(ownerProject)
      .where(and(eq(ownerProject.ownerId, ownerId), eq(ownerProject.projectId, projectId)));
  }

  async findProjectsForOwner(ownerId: number): Promise<{ project: Project }[]> {
    return this.db
      .select({ project })
      .from(ownerProject)
      .innerJoin(project, eq(ownerProject.projectId, project.id))
      .where(eq(ownerProject.ownerId, ownerId));
  }

  async findOwnersForProject(projectId: number): Promise<{ owner: Owner }[]> {
    return this.db
      .select({ owner })
      .from(ownerProject)
      .innerJoin(owner, eq(ownerProject.ownerId, owner.id))
      .where(eq(ownerProject.projectId, projectId));
  }
}
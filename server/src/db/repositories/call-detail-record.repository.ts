import { eq, and, desc } from 'drizzle-orm';
import { callDetailRecord, projectCallDetailRecord } from '../schema.js';
import type { DB, CallDetailRecord, NewCallDetailRecord } from './types.js';

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

  async linkToProject(projectId: number, callDetailRecordId: number): Promise<void> {
    await this.db.insert(projectCallDetailRecord).values({ projectId, callDetailRecordId });
  }
}

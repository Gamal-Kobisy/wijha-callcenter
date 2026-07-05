import { eq, and, desc } from 'drizzle-orm';
import { userLog } from '../schema.js';
import type { DB, UserLog, NewUserLog } from './types.js';

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

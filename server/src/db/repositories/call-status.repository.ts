import { callDetailRecord } from '../schema.js';
import type { DB } from './types.js';

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

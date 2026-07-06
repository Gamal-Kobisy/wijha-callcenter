import { eq } from 'drizzle-orm';
import { owner, numbers, ownerInfo } from '../schema.js';
import type { DB, Owner, NewOwner } from './types.js';

export class OwnerRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }
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
    numbers: { number: string | undefined }[];
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

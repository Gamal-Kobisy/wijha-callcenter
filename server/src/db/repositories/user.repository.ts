import { eq, ilike } from 'drizzle-orm';
import { user } from '../schema.js';
import type { DB, User, NewUser } from './types.js';

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

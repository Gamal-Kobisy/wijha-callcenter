import { eq } from 'drizzle-orm';
import { project } from '../schema.js';
import type { DB, Project, NewProject } from './types.js';

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

import { eq, and } from 'drizzle-orm';
import { ownerProject, project, owner } from '../schema.js';
import type { DB, Project, Owner } from './types.js';

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

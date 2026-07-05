const { afterAll, beforeEach, describe, expect, it } = require('@jest/globals');
const { sql } = require( 'drizzle-orm');
const { closeDbPools, test_db } = require('../db/pool');
const { OwnerRepository, ProjectRepository } = require('../db/repositories');
const { resetTestDatabase } = require('./helpers/db');

describe('Repository layer', () => {
  const projectRepository = new ProjectRepository(test_db);
  const ownerRepository = new OwnerRepository(test_db);

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await closeDbPools();
  });

  it('creates, updates, and deletes projects', async () => {
    const created = await projectRepository.create({ name: 'Test project', description: 'initial' });

    expect(created.id).toEqual(expect.any(Number));
    expect(created.name).toBe('Test project');

    const found = await projectRepository.findById(created.id);
    expect(found).toMatchObject({ id: created.id, name: 'Test project', description: 'initial' });

    const updated = await projectRepository.update(created.id, { description: 'updated' });
    expect(updated).toMatchObject({ id: created.id, description: 'updated' });

    const deleted = await projectRepository.delete(created.id);
    expect(deleted).toBe(true);

    const missing = await projectRepository.findById(created.id);
    expect(missing).toBeUndefined();
  });

  it('creates owners with numbers and info in one transaction', async () => {
    const created = await ownerRepository.createWithDetails({
      name: 'Alice Example',
      attemptCount: 2,
      ownerNumbers: ['+15550001111', '+15550002222'],
      info: [{ key: 'city', value: 'Cairo' }],
    });

    const details = await ownerRepository.findByIdWithDetails(created.id);

    expect(details).toMatchObject({
      id: created.id,
      name: 'Alice Example',
      attemptCount: 2,
      numbers: [{ number: '+15550001111' }, { number: '+15550002222' }],
      info: [{ key: 'city', value: 'Cairo' }],
    });
  });

  it('lists owners and projects from the clean test database', async () => {
    await test_db.execute(
      sql`INSERT INTO "project" ("name", "description") VALUES ('One', 'desc'), ('Two', 'desc')`
    );

    const projects = await projectRepository.findAll();

    expect(projects).toHaveLength(2);
    expect(projects.map((project:any) => project.name)).toEqual(['One', 'Two']);
  });
});
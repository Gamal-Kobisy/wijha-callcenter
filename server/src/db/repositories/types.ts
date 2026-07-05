import * as schema from '../schema.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type DB = NodePgDatabase<typeof schema>;
export type Project = InferSelectModel<typeof schema.project>;
export type NewProject = InferInsertModel<typeof schema.project>;
export type User = InferSelectModel<typeof schema.user>;
export type NewUser = InferInsertModel<typeof schema.user>;
export type Owner = InferSelectModel<typeof schema.owner>;
export type NewOwner = InferInsertModel<typeof schema.owner>;
export type CallDetailRecord = InferSelectModel<typeof schema.callDetailRecord>;
export type NewCallDetailRecord = InferInsertModel<typeof schema.callDetailRecord>;
export type UserLog = InferSelectModel<typeof schema.userLog>;
export type NewUserLog = InferInsertModel<typeof schema.userLog>;

// schema.ts
import {
  pgTable,
  pgEnum,
  integer,
  bigint,
  varchar,
  text,
  timestamp,
  boolean,
  char,
  primaryKey,
  serial,
} from 'drizzle-orm/pg-core';

// ---------- Enum ----------
export const userRole = pgEnum('user_role', ['admin', 'user']);

// ---------- Tables ----------

export const project = pgTable('project', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
});

export const callStatus = pgTable('call_status', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 20 }).notNull(),
});

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 50 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 50 }),
  role: userRole('role').notNull(),
  otp: varchar('otp', { length: 6 }),
  otpExpiry: timestamp('otp_expiry'),
  jwtToken: text('jwt_token'),
});

export const userLog = pgTable('user_log', {
  id: serial('id').primaryKey(),
  agentId: serial('agent_id').references(() => user.id),
  startTime: timestamp('start_time').notNull().defaultNow(),
  duration: integer('duration'), // Calculated in seconds once status changes/ends
  isActive: boolean('is_active'),
});

export const owner = pgTable('owner', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }),
  attemptCount: integer('attempt_count'),
  lastDialedAt: timestamp('last_dialed_at'),
  nextDialAt: timestamp('next_dial_at'),
});

export const numbers = pgTable('numbers', {
  number: char('number', { length: 13 }),
  ownerId: serial('owner_id').references(() => owner.id),
});

export const ownerInfo = pgTable('owner_info', {
  key: varchar('key', { length: 60 }),
  ownerId: serial('owner_id').references(() => owner.id),
  value: varchar('value', { length: 60 }),
});

export const callDetailRecord = pgTable('call_detail_record', {
  id: serial('id').primaryKey(),
  ownerId: serial('owner_id').references(() => owner.id),
  agentId: serial('agent_id').references(() => user.id),
  status: integer('status').references(() => callStatus.id),
  time: timestamp('time').notNull(),
  duration: integer('duration'),
  agentNotes: text('agent_notes'),
});

export const projectCallDetailRecord = pgTable(
  'project_call_detail_record',
  {
    projectId: serial('project_id').references(() => project.id),
    callDetailRecordId: serial('call_detail_record_id').references(
      () => callDetailRecord.id
    ),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.callDetailRecordId] }),
  ]
);

export const ownerProject = pgTable(
  'owner_project',
  {
    ownerId: serial('owner_id').references(() => owner.id),
    projectId: serial('project_id').references(() => project.id),
  },
  (table) => [
    primaryKey({ columns: [table.ownerId, table.projectId] }),
  ]
);
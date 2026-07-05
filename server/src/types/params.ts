import type { CallStatus, UserRole } from './dto.js';

export interface ListOwnersQuery {
  project_id: string;
  status?: string;
  page?: string;
  limit?: string;
}

export interface ListCallsQuery {
  owner_id?: string;
  agent_id?: string;
  project_id?: string;
  status?: CallStatus;
  from?: string;
  to?: string;
  limit?: string;
}

export interface GetNextOwnerQuery {
  project_id: string;
}

export interface ListSessionsQuery {
  from?: string;
  to?: string;
}

export interface ListUsersQuery {
  role?: UserRole;
}

export interface GetUserStatsQuery {
  from?: string;
  to?: string;
}

export interface ProjectIdParam {
  [key: string]: string;
  projectId: string;
}

export interface OwnerIdParam {
  [key: string]: string;
  ownerId: string;
}

export interface CallIdParam {
  [key: string]: string;
  callId: string;
}

export interface UserIdParam {
  [key: string]: string;
  userId: string;
}

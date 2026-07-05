// =========================================================================
// types.ts
// Types & DTOs for the Call Center Broker API (mirrors openapi.yaml)
// =========================================================================

// ---------- Enums ----------

export type CallStatus = string;

export type UserRole = "admin" | "agent";

export type OwnerStatus = "active" | "inactive";

// ---------- Owner ----------

export interface OwnerNumber {
  number: string;
}

export interface OwnerInfoEntry {
  key: string;
  value: string;
}

export interface Owner {
  id: number;
  name: string;
  status: OwnerStatus;
  attempt_count?: number;
  last_dialed_at?: string | null; // date-time
  next_dial_at?: string | null; // date-time
  numbers?: OwnerNumber[];
  info?: OwnerInfoEntry[];
}

export interface CreateOwnerRequest {
  name: string;
  project_id: number;
  status?: OwnerStatus;
  numbers: OwnerNumber[];
  info?: OwnerInfoEntry[];
}

export interface UpdateOwnerRequest {
  status?: OwnerStatus;
  next_dial_at?: string | null;
}

// ---------- Project ----------

export interface Project {
  id: number;
  name: string;
  description?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
}

// ---------- User ----------

export interface User {
  id: number;
  email: string;
  name?: string | null;
  phone_number?: string | null;
  role: UserRole;
  password_hash?: string | null;
  otp?: string | null;
  otp_expiry?: string | null; // date-time
  jwt_token?: string | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  phone_number?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  phone_number?: string;
  role?: UserRole;
}

// ---------- Calls ----------

export interface CallDetailRecord {
  id: number;
  owner_id: number;
  agent_id: number;
  status: CallStatus;
  time: string; // date-time
  duration?: number | null; // seconds
  agent_notes?: string | null;
}

export interface SubmitCallRequest {
  owner_id: number;
  status: CallStatus;
  time: string; // date-time
  duration?: number; // seconds
  agent_notes?: string;
}

export interface NotifyCallingRequest {
  owner_id?: number;
  owner_number: string;
}

// ---------- Sessions ----------

export interface UserSession {
  id: number;
  agent_id: number;
  start_time: string; // date-time
  duration?: number | null; // seconds
  is_active: boolean;
}

export interface SaveSessionRequest {
  start_time: string; // date-time
  duration?: number; // seconds
}

// ---------- Pagination ----------

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedOwners {
  data: Owner[];
  meta: PageMeta;
}

export interface PaginatedCalls {
  data: CallDetailRecord[];
  meta: PageMeta;
}

// ---------- Stats ----------

export interface UserStats {
  total_calls: number;
  answered: number;
  no_answer: number;
  busy: number;
  failed: number;
  callback: number;
  avg_duration_seconds: number;
  total_session_time_seconds: number;
}

// ---------- Auth ----------

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = {
  token: string;
  user: User;
} | { message: string };

// ---------- Errors ----------

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

// ---------- Query param shapes (for typed req.query) ----------

export interface ListOwnersQuery {
  project_id: string; // numeric string, parse with Number()
  status?: OwnerStatus;
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

// ---------- Path param shapes ----------
// Each extends an index signature so it satisfies Express's ParamsDictionary
// when used as the generic on Router.get/post/patch/delete.

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

// ---------- Auth context (attach to req after auth middleware) ----------

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
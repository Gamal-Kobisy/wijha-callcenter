export type CallStatus = string;

export type UserRole = "admin" | "user";

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
  status: string;
  attempt_count?: number;
  last_dialed_at?: string | null;
  next_dial_at?: string | null;
  numbers?: OwnerNumber[];
  info?: OwnerInfoEntry[];
}

export interface CreateOwnerRequest {
  name: string;
  project_id: number;
  status?: string;
  numbers: OwnerNumber[];
  info?: OwnerInfoEntry[];
}

export interface UpdateOwnerRequest {
  status?: string;
  next_dial_at?: string | null;
}

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

export interface User {
  id: number;
  email: string;
  name?: string | null;
  phone_number?: string | null;
  role: UserRole;
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

export interface CallDetailRecord {
  id: number;
  owner_id: number;
  agent_id: number;
  status: CallStatus;
  time: string;
  duration?: number | null;
  agent_notes?: string | null;
}

export interface SubmitCallRequest {
  owner_id: number;
  status: CallStatus;
  time: string;
  duration?: number;
  agent_notes?: string;
}

export interface NotifyCallingRequest {
  owner_id?: number;
  owner_number: string;
}

export interface UserSession {
  id: number;
  agent_id: number;
  start_time: string;
  duration?: number | null;
  is_active: boolean;
}

export interface SaveSessionRequest {
  start_time: string;
  duration?: number;
}

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

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = {
  token: string;
  user: User;
} | { message: string };

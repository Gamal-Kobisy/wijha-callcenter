export type {
  CallStatus,
  UserRole,
  OwnerNumber,
  OwnerInfoEntry,
  Owner,
  CreateOwnerRequest,
  UpdateOwnerRequest,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  CallDetailRecord,
  SubmitCallRequest,
  NotifyCallingRequest,
  UserSession,
  SaveSessionRequest,
  PageMeta,
  PaginatedOwners,
  PaginatedCalls,
  UserStats,
  LoginRequest,
  LoginResponse,
} from './dto.js';

export type {
  ListOwnersQuery,
  ListCallsQuery,
  GetNextOwnerQuery,
  ListSessionsQuery,
  ListUsersQuery,
  GetUserStatsQuery,
  ProjectIdParam,
  OwnerIdParam,
  CallIdParam,
  UserIdParam,
} from './params.js';

export type { AuthenticatedUser } from './auth.js';
export type { ApiError } from './error.js';

export {};

// Re-export the Express augmentation from auth
import './auth.js';

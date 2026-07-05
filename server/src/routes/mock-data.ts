import type {
  CallDetailRecord,
  Owner,
  Project,
  User,
  UserSession,
  UserStats,
} from "../types/index.js";

const projectSeed: Project[] = [
  {
    id: 1,
    name: "Q3 Collections Campaign",
    description: "Follow up with overdue accounts",
  },
  {
    id: 2,
    name: "VIP Retention",
    description: null,
  },
];

const ownerSeed: Owner[] = [
  {
    id: 101,
    name: "Mohamed Ali",
    status: "active",
    attempt_count: 2,
    last_dialed_at: "2026-07-01T08:15:00.000Z",
    next_dial_at: "2026-07-02T09:00:00.000Z",
    numbers: [{ number: "+201001234567" }, { number: "+201001234568" }],
    info: [
      { key: "national_id", value: "29901011234567" },
      { key: "city", value: "Cairo" },
    ],
  },
  {
    id: 102,
    name: "Sara Hassan",
    status: "inactive",
    attempt_count: 1,
    last_dialed_at: "2026-06-30T10:30:00.000Z",
    next_dial_at: null,
    numbers: [{ number: "+201002223334" }],
    info: [{ key: "segment", value: "vip" }],
  },
  {
    id: 103,
    name: "Ahmed Tarek",
    status: "active",
    attempt_count: 0,
    last_dialed_at: null,
    next_dial_at: "2026-07-02T11:00:00.000Z",
    numbers: [{ number: "+201003334445" }],
    info: [{ key: "preferred_language", value: "ar" }],
  },
];

const userSeed: User[] = [
  {
    id: 1,
    email: "agent",
    name: "Agent Smith",
    phone_number: "123-456-7890",
    role: "user",
  },
  {
    id: 2,
    email: "admin",
    name: "Admin User",
    phone_number: "098-765-4321",
    role: "admin",
  },
  {
    id: 3,
    email: "agent.jane",
    name: "Jane Doe",
    phone_number: "+201009998887",
    role: "user",
  },
];

const callSeed: CallDetailRecord[] = [
  {
    id: 5001,
    owner_id: 101,
    agent_id: 1,
    status: "answered",
    time: "2026-07-01T08:16:00.000Z",
    duration: 142,
    agent_notes: "Customer requested a callback next week.",
  },
  {
    id: 5002,
    owner_id: 102,
    agent_id: 3,
    status: "no_answer",
    time: "2026-07-01T10:30:00.000Z",
    duration: null,
    agent_notes: null,
  },
];

const sessionSeed: UserSession[] = [
  {
    id: 9001,
    agent_id: 1,
    start_time: "2026-07-01T08:00:00.000Z",
    duration: 7200,
    is_active: false,
  },
  {
    id: 9002,
    agent_id: 3,
    start_time: "2026-07-02T07:30:00.000Z",
    duration: null,
    is_active: true,
  },
];

let nextProjectId = 3;
let nextOwnerId = 104;
let nextCallId = 5003;
let nextSessionId = 9003;
let nextUserId = 4;

export const mockProjects = projectSeed;
export const mockOwners = ownerSeed;
export const mockUsers = userSeed;
export const mockCalls = callSeed;
export const mockSessions = sessionSeed;

export function getProjectById(projectId: number) {
  return mockProjects.find(project => project.id === projectId);
}

export function createProject(name: string, description?: string | null): Project {
  const project: Project = {
    id: nextProjectId,
    name,
    ...(description !== undefined ? { description } : {}),
  };

  nextProjectId += 1;
  mockProjects.push(project);
  return project;
}

export function updateProject(projectId: number, patch: Partial<Project>): Project | undefined {
  const project = getProjectById(projectId);

  if (!project) {
    return undefined;
  }

  if (patch.name !== undefined) {
    project.name = patch.name;
  }

  if (patch.description !== undefined) {
    project.description = patch.description;
  }

  return project;
}

export function deleteProject(projectId: number): boolean {
  const index = mockProjects.findIndex(project => project.id === projectId);

  if (index === -1) {
    return false;
  }

  mockProjects.splice(index, 1);
  return true;
}

export function getOwnerById(ownerId: number) {
  return mockOwners.find(owner => owner.id === ownerId);
}

export function createOwner(owner: Omit<Owner, "id">): Owner {
  const createdOwner: Owner = {
    id: nextOwnerId,
    ...owner,
  };

  nextOwnerId += 1;
  mockOwners.push(createdOwner);
  return createdOwner;
}

export function updateOwner(ownerId: number, patch: Partial<Owner>): Owner | undefined {
  const owner = getOwnerById(ownerId);

  if (!owner) {
    return undefined;
  }

  if (patch.name !== undefined) {
    owner.name = patch.name;
  }

  if (patch.status !== undefined) {
    owner.status = patch.status;
  }

  if (patch.attempt_count !== undefined) {
    owner.attempt_count = patch.attempt_count;
  }

  if (patch.last_dialed_at !== undefined) {
    owner.last_dialed_at = patch.last_dialed_at;
  }

  if (patch.next_dial_at !== undefined) {
    owner.next_dial_at = patch.next_dial_at;
  }

  if (patch.numbers !== undefined) {
    owner.numbers = patch.numbers;
  }

  if (patch.info !== undefined) {
    owner.info = patch.info;
  }

  return owner;
}

export function getNextOwner(projectId: number) {
  void projectId;
  return mockOwners.find(owner => owner.status === "active");
}

export function getCallById(callId: number) {
  return mockCalls.find(call => call.id === callId);
}

export function createCall(call: Omit<CallDetailRecord, "id">): CallDetailRecord {
  const createdCall: CallDetailRecord = {
    id: nextCallId,
    ...call,
  };

  nextCallId += 1;
  mockCalls.push(createdCall);
  return createdCall;
}

export function createSession(session: Omit<UserSession, "id">): UserSession {
  const createdSession: UserSession = {
    id: nextSessionId,
    ...session,
  };

  nextSessionId += 1;
  mockSessions.push(createdSession);
  return createdSession;
}

export function getActiveSession() {
  return mockSessions.find(session => session.is_active);
}

export function getUserById(userId: number) {
  return mockUsers.find(user => user.id === userId);
}

export function createUser(user: Omit<User, "id">): User {
  const createdUser: User = {
    id: nextUserId,
    ...user,
  };

  nextUserId += 1;
  mockUsers.push(createdUser);
  return createdUser;
}

export function updateUser(userId: number, patch: Partial<User>): User | undefined {
  const user = getUserById(userId);

  if (!user) {
    return undefined;
  }

  if (patch.email !== undefined) {
    user.email = patch.email;
  }

  if (patch.name !== undefined) {
    user.name = patch.name;
  }

  if (patch.phone_number !== undefined) {
    user.phone_number = patch.phone_number;
  }

  if (patch.role !== undefined) {
    user.role = patch.role;
  }

  return user;
}

export function deleteUser(userId: number): boolean {
  const index = mockUsers.findIndex(user => user.id === userId);

  if (index === -1) {
    return false;
  }

  mockUsers.splice(index, 1);
  return true;
}

export function getUserStats(userId: number): UserStats | undefined {
  const user = getUserById(userId);

  if (!user) {
    return undefined;
  }

  return {
    total_calls: user.role === "user" ? 12 : 0,
    answered: user.role === "user" ? 5 : 0,
    no_answer: user.role === "user" ? 3 : 0,
    busy: user.role === "user" ? 1 : 0,
    failed: user.role === "user" ? 2 : 0,
    callback: user.role === "user" ? 1 : 0,
    avg_duration_seconds: user.role === "user" ? 184.5 : 0,
    total_session_time_seconds: user.role === "user" ? 14400 : 0,
  };
}

export function mockUser(overrides?: Partial<{
  id: number;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  name: string | null;
  role: string;
  otp: string | null;
  otpExpiry: Date | null;
  jwtToken: string | null;
  profileImage: string | null;
}>) {
  return {
    id: 1,
    email: 'test@example.com',
    phoneNumber: '',
    passwordHash: '$2b$10$mockhash',
    name: 'Test User',
    role: 'user',
    otp: null,
    otpExpiry: null,
    jwtToken: null,
    profileImage: null,
    ...overrides,
  };
}

export function mockOwner(overrides?: Partial<{
  id: bigint;
  name: string | null;
  status: string | null;
  attemptCount: number | null;
  lastDialedAt: Date | null;
  nextDialAt: Date | null;
  projectId: number | null;
  numbers: { number: string; ownerId: bigint }[];
  ownerInfo: { key: string; ownerId: bigint; value: string }[];
}>) {
  return {
    id: 1n,
    name: 'John Doe',
    status: 'active',
    attemptCount: 0,
    lastDialedAt: null,
    nextDialAt: null,
    numbers: [] as { number: string; ownerId: bigint }[],
    ownerInfo: [] as { key: string; ownerId: bigint; value: string }[],
    ...overrides,
  };
}

export function mockNumber(overrides?: Partial<{
  number: string;
  ownerId: bigint;
}>) {
  return {
    number: '555-0100',
    ownerId: 1n,
    ...overrides,
  };
}

export function mockOwnerInfo(overrides?: Partial<{
  key: string;
  ownerId: bigint;
  value: string;
}>) {
  return {
    key: 'email',
    ownerId: 1n,
    value: 'john@example.com',
    ...overrides,
  };
}

export function mockCallRecord(overrides?: Partial<{
  id: bigint;
  ownerId: bigint | null;
  agentId: number | null;
  status: string | null;
  time: Date;
  duration: number | null;
  agentNotes: string | null;
}> & { owner?: Record<string, unknown> }) {
  return {
    id: 1n,
    ownerId: 1n,
    agentId: 1,
    status: 'completed',
    time: new Date('2024-06-01T12:00:00Z'),
    duration: 60,
    agentNotes: null,
    ...overrides,
  };
}

export function mockProject(overrides?: Partial<{
  id: number;
  name: string;
  description: string | null;
}>) {
  return {
    id: 1,
    name: 'Default Project',
    description: 'Main project',
    ...overrides,
  };
}

export function mockUserSession(overrides?: Partial<{
  agentId: number;
  firstBeat: Date;
  lastBeat: Date;
  duration: number;
}>) {
  return {
    agentId: 1,
    firstBeat: new Date('2024-06-01T09:00:00Z'),
    lastBeat: new Date('2024-06-01T09:30:00Z'),
    duration: 1800,
    ...overrides,
  };
}


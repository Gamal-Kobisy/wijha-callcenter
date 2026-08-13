import { apiFetch } from "./api";

// --- TYPES ---
export interface ProjectAssignment {
  project_id: number
  project_name: string
  status?: string
  attempt_count?: number
  last_dialed_at?: string | null
}

export interface OwnerPhone {
  phone: string
}

export interface OwnerInfo {
  key: string
  value: string
}

export interface Owner {
  id: number
  name?: string
  type?: string
  next_dial_at?: string | null
  phones?: OwnerPhone[]
  info?: OwnerInfo[]
  projects?: ProjectAssignment[]
}

export interface Agent {
  id: number
  name: string
  email?: string
}

export interface Project {
  id: number
  name: string
  description?: string
}

export interface StatusCount {
  status: string
  count: number
}

export interface CallRecord {
  id: number
  client_id: number
  agent_id: number
  status: string
  time: string
  duration?: number
  agent_notes?: string
  projects?: { id: number; name: string }[]
}

export interface PaginatedOwnersResponse {
  data: Owner[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

// --- FAKE DATA (Loaded from local environment variables to hide from GitHub) ---
let mockClients: Owner[] = [];
let mockAgents: Agent[] = [];
let mockProjects: Project[] = [];
let mockCalls: CallRecord[] = [];

try {
  if (import.meta.env.VITE_USE_MOCK_API === 'true') {
    if (import.meta.env.VITE_MOCK_CLIENTS) mockClients = JSON.parse(import.meta.env.VITE_MOCK_CLIENTS);
    if (import.meta.env.VITE_MOCK_AGENTS) mockAgents = JSON.parse(import.meta.env.VITE_MOCK_AGENTS);
    if (import.meta.env.VITE_MOCK_PROJECTS) mockProjects = JSON.parse(import.meta.env.VITE_MOCK_PROJECTS);
    if (import.meta.env.VITE_MOCK_CALLS) mockCalls = JSON.parse(import.meta.env.VITE_MOCK_CALLS);
  }
} catch (e) {
  console.warn("Failed to parse mock API data from environment variables.");
}

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- API CLIENT (MOCKED) ---
export const clientsApi = {
  // Clients (Owners)
  async getClients(page = 1, limit = 10): Promise<PaginatedOwnersResponse> {
    await delay(600); // Simulate network latency
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: mockClients.slice(start, end),
      meta: {
        total: mockClients.length,
        page,
        limit
      }
    };
  },

  async updateClient(ownerId: number, data: { type?: string; next_dial_at?: string | null; phones?: string[] }): Promise<Owner> {
    await delay(400);
    const idx = mockClients.findIndex(c => c.id === ownerId);
    if (idx === -1) throw new Error("Client not found");
    
    const { phones, ...rest } = data;
    mockClients[idx] = {
      ...mockClients[idx],
      ...rest,
      ...(phones ? { phones: phones.map(p => ({ phone: p })) } : {}),
    };
    return mockClients[idx];
  },

  async deleteClient(ownerId: string | number): Promise<void> {
    await delay(400);
    mockClients = mockClients.filter(c => c.id !== Number(ownerId));
  },

  async bulkCreateClients(owners: any[]): Promise<Owner[]> {
    // Real API call — saves data to database
    const response = await apiFetch("owners/bulk", {
      method: "POST",
      body: JSON.stringify({ owners }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to import clients");
    }
    return response.json();
  },

  async getStatusCounts(): Promise<StatusCount[]> {
    await delay(300);
    const counts: Record<string, number> = {};
    mockClients.forEach(c => {
      const status = c.projects?.[0]?.status || 'new';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  // Agents (Users)
  async getAgents(): Promise<Agent[]> {
    await delay(300);
    return mockAgents;
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    await delay(300);
    return mockProjects;
  },

  // Calls
  async getClientCallHistory(clientId: string | number, _limit = 50): Promise<{ data: CallRecord[] }> {
    await delay(500);
    return {
      data: mockCalls.filter(c => c.client_id === Number(clientId))
    };
  }
};
